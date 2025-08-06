import os
import subprocess
from flask import Blueprint, Response, render_template, current_app
from jinja2 import Template

from . import config

# ...existing code...

                    # This is not safe, but it's a start.
                    return Response(result.stderr, mimetype='text/plain')
            except Exception as e:
                current_app.logger.warning(e)
                return Response(str(e), mimetype='text/plain')
        else:
            # It's not a file, so we can't execute it.
            # We return a 404.
            return Response('Not found', status=404)
    except Exception as e:
        current_app.logger.warning(e)
        return Response(str(e), mimetype='text/plain')