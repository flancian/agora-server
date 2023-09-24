import os
import getpass
import yaml


def getcfg(path):
    with open(path, "r") as stream:
        try:
            return yaml.safe_load(stream)
        except yaml.YAMLError as exc:
            print(exc)


class DefaultConfig(object):
    # I wonder how much of this should be in [[agora.yaml]] instead :)

    AGORA_PATH = os.getenv(
        "AGORA_PATH", os.path.join("/home", getpass.getuser(), "agora")
    )
    SOURCES_CONFIG = getcfg(os.path.join(AGORA_PATH, "sources.yaml"))
    try:
        # try to load settings from a new-style Agora config if present.
        AGORA_CONFIG = getcfg(os.path.join(AGORA_PATH, "agora.yaml"))
    except:
        # we will catch missing settings anyway and use defaults below.
        AGORA_CONFIG = {}

    # ranking
    # up to 2023: system account goes first, then people who write *about the Agora* in their gardens, in order of joining.
    # note: I didn't like being first among the humans, I still did it because my subnodes were often of the summary/tldr kind whenever they overlapped with others.
    # ideally I'd like to relinquish control of all ranking functions to [[flancia collective]] and [[agora discuss]].
    # RANK = ['agora', 'flancian', 'vera', 'neil', 'maya', 'j0lms']

    # Uprank the system user only (again).
    # I think this is simpler and makes more sense as a default for arbitrary agoras, so let's try it again.
    RANK = ["agora"]

    # deprecated/check if unused
    AGORA_VERSION = "0.99"

    try:
        AGORA_NAME = AGORA_CONFIG["agora_name"]
    except (KeyError, TypeError):
        # Just a hopefully sane, well intentioned default ;)
        AGORA_NAME = "Agora of Flancia"
        # https://anagora.org, the reference Agora as of 2022, is run by [[Flancia Collective]].
        # See https://anagora.org/agora+doc for more.

    try:
        URL_BASE = AGORA_CONFIG["url_base"]
    except (KeyError, TypeError):
        # standard: no trailing slashes anywhere in variables.
        # with protocol
        URL_BASE = "https://anagora.org"

    try:
        URI_BASE = AGORA_CONFIG["uri_base"]
    except (KeyError, TypeError):
        URI_BASE = "anagora.org"

    try:
        API_BASE = AGORA_CONFIG["api_base"]
    except (KeyError, TypeError):
        API_BASE = "https://api.anagora.org"

    AGORA = URI_BASE

    # change this to whatever your domain is going to be -- without protocol.
    # this is what gets rendered in the header.
    # 2022-12-02: maybe deprecated in favour of using request headers to infer the host that the client wants to see? see before_request in agora.py.
    JOURNAL_ENTRIES = 31  # number of journal entries to load

    # EXPERIMENTS
    # experiments can be booleans or probabilities (reals in 0..1).
    # release process: set them initially to False/0 in the DefaultConfig and then override in the right environment.
    ENABLE_CTZN = False
    ENABLE_STATS = False
    ENABLE_OBSIDIAN_ATTACHMENTS = False
    ENABLE_AUTO_PULL = False
    ENABLE_AUTO_STOA = False


class ProductionConfig(DefaultConfig):

    # EXPERIMENTS
    ENABLE_CTZN = False
    ENABLE_STATS = True
    ENABLE_AUTO_PULL = True
    ENABLE_AUTO_STOA = False


class DevelopmentConfig(DefaultConfig):
    URL_BASE = "http://dev.anagora.org"
    URI_BASE = "dev.anagora.org"
    API_BASE = "http://localhost:3000"

    AGORA_NAME = "Alpha " + DefaultConfig.AGORA_NAME

    # EXPERIMENTS
    ENABLE_CTZN = True
    ENABLE_STATS = True
    ENABLE_OBSIDIAN_ATTACHMENTS = True
    ENABLE_AUTO_PULL = True
    ENABLE_AUTO_STOA = True


class LocalDevelopmentConfig(DefaultConfig):
    URL_BASE = "http://localhost:5017"
    URI_BASE = "localhost:5017"
    API_BASE = "http://localhost:3000"

    AGORA_NAME = "Development " + DefaultConfig.AGORA_NAME
    # EXPERIMENTS
    ENABLE_CTZN = True
    ENABLE_STATS = True
    ENABLE_OBSIDIAN_ATTACHMENTS = True
    ENABLE_AUTO_PULL = True
    ENABLE_AUTO_STOA = True
