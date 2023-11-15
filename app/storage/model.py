from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column
from sqlalchemy import Column, DateTime, UniqueConstraint, create_engine
from sqlalchemy import String
from sqlalchemy.sql import func
import os

GARDEN_DATABASE = os.environ.get("GARDEN_DATABASE", "garden.db")
engine = create_engine(f"sqlite:///{GARDEN_DATABASE}", echo=True)


class Base(DeclarativeBase):
    pass


class Subnode(Base):
    __tablename__ = "subnodes"

    id: Mapped[int] = mapped_column(primary_key=True)
    user: Mapped[str] = mapped_column(String(50))
    title: Mapped[str] = mapped_column(String(50))
    path: Mapped[str] = mapped_column(String)
    body: Mapped[str] = mapped_column(String)
    pushes: Mapped[str] = mapped_column(String, default="")
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    __table_args__ = (UniqueConstraint("user", "title", name="user_title_uc"),)

    def __repr__(self) -> str:
        return f"Subnode(title={self.title!r})"


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String, unique=True)
    last_sha: Mapped[str] = mapped_column(String, default="")


from sqlalchemy.orm import Session

session = Session(engine)

from sqlalchemy import select

Base.metadata.create_all(engine)


def subnodes_by_title(title: str):
    stmt = select(Subnode).where(Subnode.title == title)
    return session.scalars(stmt)


def subnode_by_uri(uri: str):
    [user, title] = uri.split("/")
    # cursor.execute("select * from subnodes where user=? and title=?", [user, title])
    stmt = select(Subnode).where(Subnode.user == user, Subnode.title == title)
    return session.scalars(stmt).first()


def subnodes_by_username(username: str):
    stmt = select(Subnode).where(Subnode.user == username)
    return session.scalars(stmt)


def random_node():
    stmt = select(Subnode).order_by(func.random())
    return session.scalars(stmt).first()


def latest(max):
    stmt = select(Subnode).order_by(Subnode.updated_at.desc()).limit(max)
    return session.scalars(stmt)


def top():
    stmt = select(Subnode).order_by(Subnode.updated_at.desc()).limit(1000)
    return session.scalars(stmt)


def size(title):
    stmt = select(func.count()).select_from(Subnode).where(Subnode.title == title)
    return session.scalar(stmt)


def pushed_subnodes(title):
    stmt = select(Subnode).where(Subnode.pushes.like(f"%{title}%"))
    return session.scalars(stmt)


def journals(dates):
    stmt = select(Subnode).where(Subnode.title.in_(dates))
    return session.scalars(stmt)


def users():
    stmt = select(Subnode.user).distinct()
    return session.scalars(stmt)
