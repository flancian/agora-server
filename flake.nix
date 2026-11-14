{
  description = "Agora Server: rendering the distributed knowledge commons";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";

    pyproject-nix = {
      url = "github:pyproject-nix/pyproject.nix";
      inputs.nixpkgs.follows = "nixpkgs";
    };

    uv2nix = {
      url = "github:pyproject-nix/uv2nix";
      inputs.pyproject-nix.follows = "pyproject-nix";
      inputs.nixpkgs.follows = "nixpkgs";
    };

    pyproject-build-systems = {
      url = "github:pyproject-nix/build-system-pkgs";
      inputs.pyproject-nix.follows = "pyproject-nix";
      inputs.uv2nix.follows = "uv2nix";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs =
    {
      self,
      nixpkgs,
      uv2nix,
      pyproject-nix,
      pyproject-build-systems,
      ...
    }:
    let
      inherit (nixpkgs) lib;
      systems = [
        "x86_64-linux"
        "aarch64-linux"
        "x86_64-darwin"
        "aarch64-darwin"
      ];
      forAllSystems = lib.genAttrs systems;

      workspace = uv2nix.lib.workspace.loadWorkspace {
        workspaceRoot = ./.;
      };

      overlay = workspace.mkPyprojectOverlay {
        sourcePreference = "wheel";
      };

      # Overrides for sdist-only packages in uv.lock that lack PEP 517 metadata
      # or need native C build libraries.
      pyprojectOverrides = final: prev: {
        feedgen = prev.feedgen.overrideAttrs (old: {
          nativeBuildInputs = (old.nativeBuildInputs or [ ]) ++ final.resolveBuildSystem { setuptools = [ ]; };
        });
        org-python = prev.org-python.overrideAttrs (old: {
          nativeBuildInputs = (old.nativeBuildInputs or [ ]) ++ final.resolveBuildSystem { setuptools = [ ]; };
        });
        sgmllib3k = prev.sgmllib3k.overrideAttrs (old: {
          nativeBuildInputs = (old.nativeBuildInputs or [ ]) ++ final.resolveBuildSystem { setuptools = [ ]; };
        });
        uwsgi = prev.uwsgi.overrideAttrs (old: {
          nativeBuildInputs =
            (old.nativeBuildInputs or [ ])
            ++ final.resolveBuildSystem { setuptools = [ ]; }
            ++ [ final.pkgs.pkg-config ];
          buildInputs = (old.buildInputs or [ ]) ++ [
            final.pkgs.libxcrypt
            final.pkgs.zlib
            final.pkgs.openssl
            final.pkgs.pcre2
          ];
        });
      };
    in
    {
      packages = forAllSystems (
        system:
        let
          pkgs = nixpkgs.legacyPackages.${system};

          pythonSet = (pkgs.callPackage pyproject-nix.build.packages {
            python = pkgs.python312;
          }).overrideScope (
            lib.composeManyExtensions [
              pyproject-build-systems.overlays.default
              overlay
              pyprojectOverrides
            ]
          );

          venv = pythonSet.mkVirtualEnv "agora-server-env" workspace.deps.default;

          assets = pkgs.buildNpmPackage {
            pname = "agora-server-assets";
            version = "0.1.0";
            src = lib.fileset.toSource {
              root = ./.;
              fileset = lib.fileset.unions [
                ./package.json
                ./package-lock.json
                ./app/js-src
              ];
            };
            npmDeps = pkgs.importNpmLock { npmRoot = ./.; };
            npmConfigHook = pkgs.importNpmLock.npmConfigHook;
            npmFlags = [ "--ignore-scripts" ];
            dontNpmBuild = true;

            buildPhase = ''
              runHook preBuild
              mkdir -p app/static/js
              ${lib.getExe pkgs.esbuild} app/js-src/index.ts \
                --bundle --splitting --format=esm --outdir=app/static/js
              runHook postBuild
            '';

            installPhase = ''
              runHook preInstall
              mkdir -p $out
              cp -r app/static/js/. $out/
              runHook postInstall
            '';
          };

          agora-server = pkgs.stdenv.mkDerivation {
            pname = "agora-server";
            version = "0.1.0";
            src = lib.fileset.toSource {
              root = ./.;
              fileset = lib.fileset.unions [
                ./app
                ./scripts
                ./prod.ini
              ];
            };

            installPhase = ''
              runHook preInstall

              mkdir -p $out/share/agora-server $out/bin
              cp -r app scripts prod.ini $out/share/agora-server/

              # Replace js-src / any stale static/js with the Nix-built esbuild bundle.
              rm -rf $out/share/agora-server/app/static/js
              mkdir -p $out/share/agora-server/app/static/js
              cp -r ${assets}/. $out/share/agora-server/app/static/js/

              cat > $out/share/agora-server/nix-env.sh <<EOF
              export PATH="${lib.makeBinPath [ pkgs.git venv ]}:\$PATH"
              export PYTHONPATH="$out/share/agora-server\''${PYTHONPATH:+:\$PYTHONPATH}"
              if [ -z "\''${SSL_CERT_FILE:-}" ] || [ ! -r "\''${SSL_CERT_FILE}" ]; then
                export SSL_CERT_FILE="${pkgs.cacert}/etc/ssl/certs/ca-bundle.crt"
              fi
              export FLASK_APP=app
              export FLASK_ENV="\''${FLASK_ENV:-production}"
              export AGORA_CONFIG="\''${AGORA_CONFIG:-ProductionConfig}"
              EOF

              cat > $out/bin/agora-server <<EOF
              #!${pkgs.runtimeShell}
              set -euo pipefail
              source "$out/share/agora-server/nix-env.sh"
              exec ${venv}/bin/gunicorn \
                --chdir "$out/share/agora-server" \
                -w "\''${GUNICORN_WORKERS:-4}" \
                -b "0.0.0.0:\''${PORT:-5017}" \
                "app:create_app()" "\$@"
              EOF
              chmod +x $out/bin/agora-server

              cat > $out/bin/agora-server-uwsgi <<EOF
              #!${pkgs.runtimeShell}
              set -euo pipefail
              source "$out/share/agora-server/nix-env.sh"
              cd "$out/share/agora-server"
              exec ${venv}/bin/uwsgi "\''${1:-prod.ini}" "\''${@:2}"
              EOF
              chmod +x $out/bin/agora-server-uwsgi

              cat > $out/bin/agora-server-worker <<EOF
              #!${pkgs.runtimeShell}
              set -euo pipefail
              source "$out/share/agora-server/nix-env.sh"
              exec ${venv}/bin/python3 "$out/share/agora-server/scripts/worker.py" "\$@"
              EOF
              chmod +x $out/bin/agora-server-worker

              runHook postInstall
            '';

            meta = {
              description = "Agora Server: rendering the distributed knowledge commons";
              homepage = "https://anagora.org";
              mainProgram = "agora-server";
            };
          };
        in
        {
          default = agora-server;
          inherit agora-server assets venv;
        }
      );

      apps = forAllSystems (
        system:
        let
          pkg = self.packages.${system}.agora-server;
        in
        {
          default = {
            type = "app";
            program = "${pkg}/bin/agora-server";
          };
          agora-server = {
            type = "app";
            program = "${pkg}/bin/agora-server";
          };
          uwsgi = {
            type = "app";
            program = "${pkg}/bin/agora-server-uwsgi";
          };
          worker = {
            type = "app";
            program = "${pkg}/bin/agora-server-worker";
          };
        }
      );

      devShells = forAllSystems (
        system:
        let
          pkgs = nixpkgs.legacyPackages.${system};
        in
        {
          default = pkgs.mkShell {
            packages = with pkgs; [
              python312
              uv
              nodejs
              esbuild
              git
              gcc
              pkg-config
              libxcrypt
            ];
          };
        }
      );

      checks = forAllSystems (
        system:
        let
          pkgs = nixpkgs.legacyPackages.${system};
          agora-server = self.packages.${system}.agora-server;
        in
        {
          smoke-test = pkgs.runCommand "agora-server-smoke-test" {
            nativeBuildInputs = [ pkgs.curl ];
          } ''
            set -euo pipefail
            export HOME="$TMPDIR/home"
            export AGORA_PATH="$TMPDIR/agora"
            mkdir -p "$HOME" "$AGORA_PATH/garden/agora"
            cat > "$AGORA_PATH/sources.yaml" <<YAML
            - target: garden/agora
              url: https://example.com/agora.git
              format: markdown
            YAML
            cat > "$AGORA_PATH/garden/agora/hello.md" <<MD
            # Hello Agora
            Testing [[Nix]] packaging!
            MD

            export PORT=15017
            export GUNICORN_WORKERS=1
            export AGORA_CONFIG=DevelopmentConfig
            export FLASK_ENV=development

            ${agora-server}/bin/agora-server > "$TMPDIR/server.log" 2>&1 &
            PID=$!
            trap 'kill "$PID" 2>/dev/null || true' EXIT

            for i in $(seq 1 30); do
              if curl -fsS "http://127.0.0.1:$PORT/" > "$TMPDIR/index.html"; then
                break
              fi
              sleep 0.5
            done

            if ! grep -qi "Agora" "$TMPDIR/index.html"; then
              cat "$TMPDIR/server.log"
              exit 1
            fi

            curl -fsS "http://127.0.0.1:$PORT/static/js/index.js" > /dev/null
            touch "$out"
          '';
        }
      );
    };
}
