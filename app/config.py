import os
import getpass

AGORA_PATH = os.getenv('AGORA_PATH', os.path.join('/home', getpass.getuser(), 'agora'))
AGORA_VERSION = '0.5.3'

URL_BASE = "https://anagora.org"
URI_BASE = "anagora.org"
AGORA = URI_BASE
