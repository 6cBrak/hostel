#!/usr/bin/env python3
"""Envoi d'un email (avec pièce jointe optionnelle) via SMTP — utilisé par backup.sh.

Usage : send_mail.py SMTP_HOST SMTP_PORT FROM PASSWORD TO SUBJECT BODY [ATTACHMENT_PATH]
"""
import smtplib
import ssl
import sys
from email.message import EmailMessage
from pathlib import Path


def main():
    if len(sys.argv) < 8:
        print("Usage: send_mail.py HOST PORT FROM PASSWORD TO SUBJECT BODY [ATTACHMENT]", file=sys.stderr)
        sys.exit(1)

    host, port, sender, password, to, subject, body = sys.argv[1:8]
    attachment = sys.argv[8] if len(sys.argv) > 8 else ""

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = sender
    msg["To"] = to
    msg.set_content(body)

    if attachment and Path(attachment).exists():
        data = Path(attachment).read_bytes()
        msg.add_attachment(
            data, maintype="application", subtype="gzip", filename=Path(attachment).name
        )

    context = ssl.create_default_context()
    with smtplib.SMTP_SSL(host, int(port), context=context) as server:
        server.login(sender, password)
        server.send_message(msg)


if __name__ == "__main__":
    main()
