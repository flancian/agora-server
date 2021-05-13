import os
import getpass

class DefaultConfig(object):
    AGORA_PATH = os.getenv('AGORA_PATH', os.path.join('/home', getpass.getuser(), 'agora'))
    # deprecated/check if unused
    AGORA_VERSION = '0.5.3'
    # standard: no trailing slashes anywhere in variables.
    # with protocol
    URL_BASE = "https://anagora.org"
    # without protocol
    URI_BASE = "anagora.org"
    AGORA = URI_BASE
    
    # EXPERIMENTS
    # experiments can be booleans or probabilities (reals in 0..1).
    # release process: set them initially to False/0 in the DefaultConfig and then override in the right environment.
    ENABLE_CTZN = False
    ENABLE_NODE_COUNT = False

class ProductionConfig(DefaultConfig):
    
    # EXPERIMENTS
    ENABLE_CTZN = True

class DevelopmentConfig(DefaultConfig):
    URL_BASE = "http://dev.anagora.org"
    URI_BASE = "dev.anagora.org"

    # EXPERIMENTS
    ENABLE_CTZN = True
    ENABLE_NODE_COUNT = True
