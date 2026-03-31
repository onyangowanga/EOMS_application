#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'eoms_api.settings')
django.setup()

from apps.committees.models import Committee

print("All committees in database (ordered by id DESC):")
all_committees = Committee.objects.all().order_by('-id')
for c in all_committees:
    event_info = f"Event ID: {c.event_id}" if c.event_id else "Event: NULL"
    print(f"  - ID: {c.id}, Name: {c.name}, {event_info}, Type: {c.committee_type}, is_main: {c.is_main}")

print(f"\nTotal committees: {all_committees.count()}")

print("\n\nCommittees with NULL event:")
null_event_committees = Committee.objects.filter(event__isnull=True)
for c in null_event_committees:
    print(f"  - ID: {c.id}, Name: {c.name}, Type: {c.committee_type}")

print(f"\nTotal with NULL event: {null_event_committees.count()}")

print("\n\nLast 5 created committees:")
last_5 = Committee.objects.all().order_by('-id')[:5]
for c in last_5:
    event_info = f"Event ID: {c.event_id}" if c.event_id else "Event: NULL"
    print(f"  - ID: {c.id}, Name: {c.name}, {event_info}, Type: {c.committee_type}, Created: {c. created_at if hasattr(c, 'created_at') else 'N/A'}")
