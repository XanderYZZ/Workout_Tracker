from datetime import datetime, time, timezone
from zoneinfo import ZoneInfo

def LocalDateRangeToUTC(start_date, end_date, tz_name: str):
    tz = ZoneInfo(tz_name)

    local_start = datetime.combine(start_date, time.min, tzinfo=tz)
    local_end   = datetime.combine(end_date, time.max, tzinfo=tz)

    return (
        local_start.astimezone(timezone.utc),
        local_end.astimezone(timezone.utc),
    )