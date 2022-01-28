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
    AGORA_PATH = os.getenv('AGORA_PATH', os.path.join('/home', getpass.getuser(), 'agora'))
    YAML_CONFIG = getcfg(os.path.join(AGORA_PATH, 'sources.yaml'))
    # deprecated/check if unused
    AGORA_VERSION = '0.9'
    # standard: no trailing slashes anywhere in variables.
    # with protocol
    URL_BASE = "https://anagora.org"
    API_BASE = "https://api.anagora.org"

    #TODO change this to whatever prod is going to be
    # without protocol
    URI_BASE = "anagora.org"
    AGORA = URI_BASE
    JOURNAL_ENTRIES = 31 # number of journal entries to load
    
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

    # EXPERIMENTS
    ENABLE_CTZN = True
    ENABLE_STATS = True
    ENABLE_OBSIDIAN_ATTACHMENTS = True
    ENABLE_AUTO_PULL = False
    ENABLE_AUTO_STOA = True

class LocalDevelopmentConfig(DefaultConfig):
    URL_BASE = "http://localhost:5000"
    URI_BASE = "http://localhost:5000"
    API_BASE = "http://localhost:3000"

    # EXPERIMENTS
    ENABLE_CTZN = True
    ENABLE_STATS = True
    ENABLE_OBSIDIAN_ATTACHMENTS = True
    ENABLE_AUTO_PULL = True
    ENABLE_AUTO_STOA = True
