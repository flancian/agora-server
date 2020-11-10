# To use
This Agora Server is meant to be used in conjunction with an Agora. An Agora is
a collection of digital gardens and other information sources that are assembled
into a distributed knowledge graph.

For an example Agora, and for more information on the Agora design, please refer to <https://flancia.org/go/agora>.

To see the Agora Server in action with the example Agora, please visit
<https://anagora.org>.

# To develop

Install OS dependencies:
```
$ apt-get install python3 python3-venv python3-pip
```

Then Flask inside a virtual environment in this directory:
```
python3 -m venv venv
. venv/bin/activate
pip install -r requirements.txt
```

Then run the development server:
```
./run.sh
```

Please see [CONTRIBUTING](CONTRIBUTING.md) for instructions on how to
contribute; it may require a one-time signing of a Google CLA.

Note this project *is not an official Google project*, and will not be supported by
Google. It was simply initiated by flancian@ while employed at Google, and
thus copyright belongs to Google as indicated in LICENSE and in various license
headers. This should be of essentially no effect to you or its users (beyond the
required signing of the CLA if you contribute), as it is released under an open
license; please reach out to flancian@ or some other maintainer if this concerns you.  

## Optional: my git configuration

(Tangent) in case this is your first git contribution/you just haven't done it and you find this useful. This is my git config:

```
git config --global user.email "example@example.org"
git config --global user.name "Example"
git config --global alias.st status
git config --global alias.ci commit
git config --global alias.co checkout
git config --global alias.f "reset --hard HEAD"
```

## About the project
As you might have inferred from the above, this project is based on [Flask](https://flask.palletsprojects.com). ```/app``` hosts the Flask app. In it:

```/templates``` are Jinja2 templates.
```__init__.py``` has the high level Flask setup.
```agora.py``` does rendering (url maps, views).
```db.py``` has logic to read/process notes. The db is actually the filesystem :)
