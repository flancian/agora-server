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
    SECRET_KEY = os.environ.get("SECRET_KEY", "a-default-secret-key-for-development")
    # I wonder how much of this should be in [[agora.yaml]] instead :)

    # This configures the main search/exec/go/visit/find button and the piece of flair :)
    AGORA_ACTION_0 = 'search'
    AGORA_ACTION_1= 'go'
    AGORA_ACTION_2= 'pull'

    AGORA_NAME_SHORT = 'Agora'

    AGORA_FLAIR = '🏛️'

    # What the Agora shows as 'class'/category in the summary (title) for the node div.
    NODE_LABEL = '📚 Node'
    STOAS_LABEL = '💬 Stoas'
    # MENU_SEPARATOR = '⸖'
    # Keep it simple?
    MENU_SEPARATOR = '❦'
    MENU_SEPARATOR = '፨'
    MENU_SEPARATOR_2 = '჻'
    MENU_SEPARATOR = '•'
    MENU_SEPARATOR = '𑗄'
    MENU_SEPARATOR = '⸱'
    AI_PROMPT = f"""
        You are a friendly and helpful assistant whose task is to help people navigate the internet in general and in particular the Knowledge Commons we are in, called the Agora.

        When responding, please try to ALWAYS surround a few interesting entities (things, people or concepts) with [[double square brackets]]. The Agora will resolve these [[wikilinks]] to URLs for the convenience of the user. You can use Markdown in your responses.

        Try to be insightful, compassionate and delightful.

        Now please write an interesting response to the following prompt or query:

        """

    AGORA_PATH = os.getenv(
        "AGORA_PATH", os.path.join("/home", getpass.getuser(), "agora")
    )
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        'sqlite:///' + os.path.join(AGORA_PATH, 'agora.db') + '?check_same_thread=false'
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    SOURCES_CONFIG = getcfg(os.path.join(AGORA_PATH, "sources.yaml"))
    try:
        # try to load settings from a new-style Agora config if present.
        AGORA_CONFIG = getcfg(os.path.join(AGORA_PATH, "agora.yaml"))
    except:
        # we will catch missing settings anyway and use defaults below.
        AGORA_CONFIG = {}

    # [[ranking]] happens here.
    # up to 2023: system account goes first, then people who write *about the Agora* in their gardens, in order of joining.
    # note: I didn't like being first among the humans, I still did it because my subnodes were often of the summary/tldr kind whenever they overlapped with others.
    # ideally I'd like to relinquish control of all ranking functions to [[flancia collective]] and [[agora discuss]].
    # update (2024): back to having an actual notion of ranking; PRs more than accepted, welcomed :D
    RANK = ['agora', 'flancian', 'vera', 'neil', 'maya', 'j0lms', 'bouncepaw']

    # Uprank the system user only (again).
    # I think this is simpler and makes more sense as a default for arbitrary agoras, so let's try it again.
    # RANK = ["agora"]
    # Update (2024): I think https://anagora.org is more readable when we uprank the above users. The list is, thankfully, ever growing!

    # deprecated/check if unused
    AGORA_VERSION = "0.999"

    # This is a lot of boilerplate, could be refactored? :)
    PROD_URL_BASE = "https://anagora.org"
    DEV_URL_BASE = "https://tar.agor.ai"
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
        # We could try to run this as a 'wildcard Agora', serving back whatever we got in client headers.
        # pass
        # standard: no trailing slashes anywhere in variables.
        # with protocol
        URL_BASE = "https://anagora.org"

    try:
        URI_BASE = AGORA_CONFIG["uri_base"]
    except (KeyError, TypeError):
        # We could try to run this as a 'wildcard Agora', serving back whatever we got in client headers.
        # pass
        URI_BASE = "anagora.org"

    try:
        API_BASE = AGORA_CONFIG["api_base"]
    except (KeyError, TypeError):
        API_BASE = "https://api.anagora.org"

    AGORA = URI_BASE

    try:
        SOURCE = AGORA_CONFIG["server"]
    except (KeyError, TypeError):
        SOURCE = 'https://github.com/flancian/agora-server'

    try:
        ROOT = AGORA_CONFIG["root"]
    except (KeyError, TypeError):
        ROOT = 'https://github.com/flancian/agora'


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
    ENABLE_ORGORA = False
    ENABLE_HYPOTHESIS = False
    ENABLE_SQLITE = False
    ENABLE_AGORA_PROTOCOL = False
    ENABLE_FLUSH_CACHE_BUTTON = False
    # If True, G.node(uri) fetches from DB on demand (low RAM, high latency).
    # If False, G.nodes() loads full graph into RAM at startup (high RAM, zero latency).
    ENABLE_LAZY_LOAD = False
    USE_GIT_MTIME = False

    # ActivityPub settings
    ACTIVITYPUB_SEND_WELCOME_PACKAGE = True

    # EXPERIMENTS WHICH ARE SECURITY SENSITIVE.
    # PLEASE ENABLE CAREFULLY WHEN RUNNING IN A CONTAINER OR IN CHAOS MODE :)
    ENABLE_EXECUTABLE_NODES = False

    # AI features. ENABLE_AI controls the Agora trying to generate with providers; requires per-provider API keys to be available as environment variables.
    ENABLE_AI = False

    # TTLs for various caches in seconds. Set to 0 to disable caching for a given type.
    SQLITE_CACHE_TTL = {
        'ai_generation': 3600 * 24 * 7,  # 1 week
    }

    QUERY_CACHE_TTL = {
        'all_users': 3600, # 1 hour
        'all_journals': 3600, # 1 hour
        'latest': 3600,    # 1 hour
        'top': 3600,       # 1 hour
    }

    # Set os env variable MISTRAL_API_KEY when enabled.
    try:
        MISTRAL_API_KEY = os.environ["MISTRAL_API_KEY"]
    except:
        MISTRAL_API_KEY = False

    try:
        GEMINI_API_KEY = os.environ["GEMINI_API_KEY"]
    except:
        GEMINI_API_KEY = False

    # Auto pull rules.
    # A list of dictionaries, each with a 'pattern' (regex) and a list of 'templates'.
    # If a node's name matches the pattern, the templates will be rendered as virtual subnodes.
    # The '{node}' placeholder in the template will be replaced with the matched node name.
    AUTO_PULLS = [
        {
            'pattern': r'^\d+$',  # Matches any node that is a number.
            'templates': [
                'prime/{node}',
                'hex/{node}',
                'factor/{node}',
                'calc/{node}',
            ]
        }
    ]


class ProductionConfig(DefaultConfig):

    # EXPERIMENTS
    ENABLE_CTZN = False
    ENABLE_STATS = True
    ENABLE_AUTO_PULL = True
    ENABLE_AUTO_PUSH = False
    ENABLE_AUTO_STOA = False
    ENABLE_ORGORA = True
    ENABLE_HYPOTHESIS = True

    # EXPERIMENTS WHICH ARE SECURITY SENSITIVE.
    ENABLE_EXECUTABLE_NODES = False

    # EXPERIMENTS WHICH REQUIRE FURTHER SETUP / MAY BE EXPENSIVE.
    ENABLE_AI = False

    # EXPERIMENTS 
    # we need to remove as CTZN is no longer a thing? or use to implement something similar in-place?
    ENABLE_CTZN = False
    ENABLE_STATS = True
    ENABLE_AUTO_PULL = True
    ENABLE_AUTO_PUSH = True
    ENABLE_AUTO_STOA = False
    # I think all of the above can be removed as of [[2025-08-31]].

    # PLEASE ENABLE CAREFULLY WHEN RUNNING IN A CONTAINER OR IN CHAOS MODE :)
    # I guess because we're "responsible" we don't allow code execution by default in the most prod of all Agora instances? Hmm.
    ENABLE_EXECUTABLE_NODES = False

    # Set MISTRAL_API_KEY env variable when enabling :)
    ENABLE_AI = True

    # This seems to work great but I haven't tested it beyond AlphaConfig (which is what we run in anagora.org as of [[2025]]), so leaving it set to False for now.
    # This keeps the Agora completely file-based and able to run in a read-only filesystem. Setting it to True if the Agora can't write should still work but default to file-based.
    ENABLE_SQLITE = False


class AlphaConfig(DefaultConfig):

    # EXPERIMENTS 
    # we need to remove as CTZN is no longer a thing? or use to implement something similar in-place?
    ENABLE_CTZN = False
    ENABLE_STATS = True
    ENABLE_AUTO_PULL = True
    ENABLE_AUTO_PUSH = True
    ENABLE_AUTO_STOA = False
    # PLEASE ENABLE CAREFULLY WHEN RUNNING IN A CONTAINER OR IN CHAOS MODE :)
    ENABLE_EXECUTABLE_NODES = True
    ENABLE_ORGORA = False
    ENABLE_HYPOTHESIS = True

    # Set API key env variables as needed :)
    ENABLE_AI = True

    # Finally took place early on 2025-08-29. Requires a writeable filesystem.
    ENABLE_SQLITE = True
    ENABLE_DEMO = True
    ENABLE_AGORA_PROTOCOL = True


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
    ENABLE_ORGORA = False
    ENABLE_HYPOTHESIS = True
    ENABLE_SQLITE = True

    # PLEASE ENABLE CAREFULLY WHEN RUNNING IN A CONTAINER OR IN CHAOS MODE :)
    ENABLE_EXECUTABLE_NODES = True

    # Set MISTRAL_API_KEY env variable when enabling :)
    ENABLE_AI = True
    ENABLE_AGORA_PROTOCOL = True


class LocalDevelopmentConfig(DefaultConfig):
    # Empty is better if you e.g. want to access this on localhost:5017 but also on the IP that the dev machine has in the LAN.
    URL_BASE = ""
    URI_BASE = "localhost:5017"
    API_BASE = "http://localhost:3000"

    AGORA_NAME = "Development " + DefaultConfig.AGORA_NAME
    # EXPERIMENTS
    ENABLE_CTZN = True
    ENABLE_STATS = True
    ENABLE_OBSIDIAN_ATTACHMENTS = True
    ENABLE_AUTO_PULL = True
    ENABLE_AUTO_STOA = True
    ENABLE_ORGORA = False
    ENABLE_HYPOTHESIS = True
    ENABLE_SQLITE = True
    ENABLE_LAZY_LOAD = False

    # PLEASE ENABLE CAREFULLY WHEN RUNNING IN A CONTAINER OR IN CHAOS MODE :)
    ENABLE_EXECUTABLE_NODES = True

    # Set MISTRAL_API_KEY and GEMINI_API_KEY env variables when enabling :)
    ENABLE_AI = True
    ENABLE_AGORA_PROTOCOL = True

    # Demo mode settings
    ENABLE_DEMO = True
    AGORA_DEMO_TARGET = "https://anagora.org"
    ENABLE_FLUSH_CACHE_BUTTON = True
