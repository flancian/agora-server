{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  buildInputs = with pkgs; [
    nodejs
    gcc
    libxcrypt
    uv
    git
  ];
}
