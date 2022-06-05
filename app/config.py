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
    # yes, it's this simple currently -- but this is just a server-side default :)
    # system account goes first, then people who write *about the Agora* in their gardens, in order of joining.
    # note: I don't like being first among the humans, I still do it because my subnodes are often of the summary/tldr kind whenever they overlap with others.
    # I'd like to relinquish control of ranking functions in favour of [[flancia collective]], [[agora discuss]] in that order.
    # Jayu temporarily out as they left the Agora while rebooting their garden.
    RANK = ['agora', 'flancian', 'vera', 'neil', 'maya', 'j0lms']
    # deprecated/check if unused
    AGORA_VERSION = '0.9'
    # standard: no trailing slashes anywhere in variables.
    # with protocol
    URL_BASE = "https://anagora.org"
    API_BASE = "https://api.anagora.org"
    # https://anagora.org is run by the [[Flancia Collective]].
    NAME = "An Agora"
    MAINTAINER = "Flancia Collective"   

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
    ENABLE_AUTO_PULL = True
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
