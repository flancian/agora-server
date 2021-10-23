These will tend to be code that runs on a per-node basis in one of two ways:

1. Actions can have a "default handler" that renders a subnode in nodes matching their name. For example, dice.py is expected to render a subnode in anagora.org/dice. The node builder in agora.py will call out to it if it exists. This helps serving node-specific interface elements, like a dice throw UI, ranked high within other subnodes in the same node -- that is, without obscuring the node content.
2. Actions can also have "composite handlers" -- there are Flask routes that will execute an action with a node or query string as a parameter. /dice/6, for example, can be expected to output a number 1..6 (as plain text or html?), the result of throwing a six-sided die. This can be called by client code outside of the main (server-side) rendering code.

