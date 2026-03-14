from fastapi import APIRouter, Header, status
from fastapi.responses import JSONResponse
import config
from tasks import SendWeeklySummary

router = APIRouter(tags=["internal"], prefix="/internal")


@router.get("/weekly-summary", status_code=status.HTTP_200_OK)
async def weekly_summary(authorization: str = Header(...)):
    if authorization != f"Bearer {config.CRON_SECRET}":
        return JSONResponse(status_code=401, content={"detail": "Unauthorized"})

    SendWeeklySummary()
    return {"detail": "Weekly summary sent"}
