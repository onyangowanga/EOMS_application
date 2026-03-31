#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'eoms_api.settings')
django.setup()

from apps.committees.models import Committee

print("All committees in database:")
all_committees = Committee.objects.all().order_by('-id')
for c in all_committees:
    print(f"  - ID: {c.id}, Name: {c.name}, Event ID: {c.event_id if c.event else 'None'}, Type: {c.committee_type}")

print(f"\nTotal committees: {all_committees.count()}")

print("\n\nCommittees for event 11:")
event11_committees = Committee.objects.filter(event_id=11).order_by('-id')
for c in event11_committees:
    print(f"  - ID: {c.id}, Name: {c.name}, Type: {c.committee_type}")

print(f"\nTotal for event 11: {event11_committees.count()}")
