import subprocess
from unittest import mock
import pytest
from app import render

def test_mycomarkup_rendering_success(test_agora):
    # Mock mycomarkup binary available
    with mock.patch("shutil.which", return_value="/usr/bin/mycomarkup"), \
         mock.patch("subprocess.check_output", return_value=b"rendered mycomarkup content") as mock_run:
        res = render.mycomarkup("some source")
        assert "rendered mycomarkup content" in res
        mock_run.assert_called_once()
        assert mock_run.call_args[1]["timeout"] == 5.0

def test_mycomarkup_rendering_timeout(test_agora):
    # Mock mycomarkup timing out
    with mock.patch("shutil.which", return_value="/usr/bin/mycomarkup"), \
         mock.patch("subprocess.check_output", side_effect=subprocess.TimeoutExpired("mycomarkup", 5.0)):
        res = render.mycomarkup("some source")
        assert "Mycomarkup parsing timed out" in res

def test_mycomarkup_rendering_failure(test_agora):
    # Mock mycomarkup failing
    with mock.patch("shutil.which", return_value="/usr/bin/mycomarkup"), \
         mock.patch("subprocess.check_output", side_effect=RuntimeError("Some error")):
        res = render.mycomarkup("some source")
        assert "Mycomarkup parsing failed" in res

def test_latex_rendering_success_pypandoc(test_agora):
    # Mock pypandoc returning a valid binary path
    with mock.patch("pypandoc.get_pandoc_path", return_value="/venv/bin/pandoc"), \
         mock.patch("shutil.which", return_value="/venv/bin/pandoc"), \
         mock.patch("subprocess.check_output", return_value=b"rendered html via pypandoc") as mock_run:
        res = render.latex("some latex source")
        assert "rendered html via pypandoc" in res
        expected_input = (
            r"\providecommand{\widepoetry}[1]{\begin{quote}#1\end{quote}}" + "\n" +
            r"\providecommand{\dexteremph}[1]{\textit{#1}}" + "\n" +
            r"\providecommand{\fleurona}{\begin{center}❦\end{center}}" + "\n" +
            r"\providecommand{\fleuronb}{\begin{center}❊\end{center}}" + "\n" +
            "some latex source"
        ).encode("utf-8")
        mock_run.assert_called_once_with(
            ["/venv/bin/pandoc", "--from", "latex", "--to", "html"],
            input=expected_input,
            timeout=5.0
        )

def test_latex_rendering_success_system(test_agora):
    # Mock pypandoc failing, falling back to system pandoc
    with mock.patch("pypandoc.get_pandoc_path", side_effect=ImportError("No module")), \
         mock.patch("shutil.which", side_effect=lambda x: "/usr/bin/pandoc" if x == "pandoc" else None), \
         mock.patch("subprocess.check_output", return_value=b"rendered html via system pandoc") as mock_run:
        res = render.latex("some latex source")
        assert "rendered html via system pandoc" in res
        expected_input = (
            r"\providecommand{\widepoetry}[1]{\begin{quote}#1\end{quote}}" + "\n" +
            r"\providecommand{\dexteremph}[1]{\textit{#1}}" + "\n" +
            r"\providecommand{\fleurona}{\begin{center}❦\end{center}}" + "\n" +
            r"\providecommand{\fleuronb}{\begin{center}❊\end{center}}" + "\n" +
            "some latex source"
        ).encode("utf-8")
        mock_run.assert_called_once_with(
            ["/usr/bin/pandoc", "--from", "latex", "--to", "html"],
            input=expected_input,
            timeout=5.0
        )

def test_latex_rendering_timeout(test_agora):
    # Mock pypandoc returning a valid binary path, but timing out
    with mock.patch("pypandoc.get_pandoc_path", return_value="/venv/bin/pandoc"), \
         mock.patch("shutil.which", return_value="/venv/bin/pandoc"), \
         mock.patch("subprocess.check_output", side_effect=subprocess.TimeoutExpired("pandoc", 5.0)):
        res = render.latex("some latex source")
        assert "LaTeX compiling to HTML timed out" in res
        assert "some latex source" in res

def test_latex_rendering_no_pandoc(test_agora):
    # Mock both pypandoc and system pandoc not available
    with mock.patch("pypandoc.get_pandoc_path", side_effect=ImportError("No module")), \
         mock.patch("shutil.which", return_value=None):
        res = render.latex("some latex source")
        assert "Pandoc binary not found" in res
        assert "some latex source" in res


from app.graph import guess_mediatype, Subnode

def test_guess_mediatype():
    assert guess_mediatype("file.py") == "text/x-python"
    assert guess_mediatype("file.tex") == "text/x-tex"
    assert guess_mediatype("file.latex") == "text/x-tex"
    assert guess_mediatype("file.mp4") == "video/mp4"
    assert guess_mediatype("file.webm") == "video/webm"
    assert guess_mediatype("file.mp3") == "audio/mpeg"
    assert guess_mediatype("file.png") == "image/png"
    assert guess_mediatype("file.pdf") == "application/pdf"
    assert guess_mediatype("file.unknown_extension") == "application/octet-stream"

from flask import current_app
import os

def test_subnode_media_rendering(test_agora):
    # Test rendering dispatch for different media types
    agora_path = current_app.config["AGORA_PATH"]
    
    s_video = Subnode(os.path.join(agora_path, "garden", "user1", "video.mp4"), "video/mp4")
    assert "<video controls" in s_video.render()
    assert 'src="/raw/garden/user1/video.mp4"' in s_video.render()

    s_audio = Subnode(os.path.join(agora_path, "garden", "user1", "audio.mp3"), "audio/mpeg")
    assert "<audio controls" in s_audio.render()
    assert 'src="/raw/garden/user1/audio.mp3"' in s_audio.render()

    s_image = Subnode(os.path.join(agora_path, "garden", "user1", "pic.png"), "image/png")
    assert "<img" in s_image.render()
    assert 'src="/raw/garden/user1/pic.png"' in s_image.render()

    s_binary = Subnode(os.path.join(agora_path, "garden", "user1", "doc.pdf"), "application/pdf")
    assert "Download File (doc.pdf)" in s_binary.render()
    assert 'href="/raw/garden/user1/doc.pdf"' in s_binary.render()

def test_media_subnode_memory_optimization(test_agora):
    # Test that binary files (images, video, etc) do not load content in RAM
    agora_path = current_app.config["AGORA_PATH"]
    s_image = Subnode(os.path.join(agora_path, "garden", "user1", "pic.png"), "image/png")
    assert s_image.content == b""
    
    s_video = Subnode(os.path.join(agora_path, "garden", "user1", "video.mp4"), "video/mp4")
    assert s_video.content == b""

