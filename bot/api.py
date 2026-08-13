from typing import Any
import httpx

from config import config


class BridgeError(RuntimeError):
    pass


class WebBridge:
    def __init__(self) -> None:
        self.base_url = f"{config.web_api_url}/api/bot"
        self.headers = {"Authorization": f"Bearer {config.bot_api_secret}"}

    async def request(self, method: str, path: str, *, params: dict[str, str] | None = None, json: dict[str, Any] | None = None) -> dict[str, Any]:
        try:
            async with httpx.AsyncClient(timeout=25) as client:
                response = await client.request(method, f"{self.base_url}{path}", headers=self.headers, params=params, json=json)
        except httpx.HTTPError as exc:
            raise BridgeError("Web sayt bilan bog‘lanib bo‘lmadi. Keyinroq urinib ko‘ring.") from exc

        try:
            payload = response.json()
        except ValueError as exc:
            raise BridgeError("Web sayt noto‘g‘ri javob qaytardi.") from exc
        if response.is_error:
            raise BridgeError(payload.get("error", "Amalni bajarib bo‘lmadi."))
        return payload

    async def shops(self) -> list[dict[str, Any]]:
        return (await self.request("GET", "/shops"))["shops"]

    async def today_summary(self, shop_id: str | None = None) -> dict[str, Any]:
        params = {"period": "today"}
        if shop_id:
            params["shop_id"] = shop_id
        return await self.request("GET", "/summary", params=params)

    async def month_summary(self, shop_id: str | None = None) -> dict[str, Any]:
        params = {"period": "month"}
        if shop_id:
            params["shop_id"] = shop_id
        return await self.request("GET", "/summary", params=params)

    async def add_sale(self, data: dict[str, Any]) -> dict[str, Any]:
        return (await self.request("POST", "/sales", json=data))["sale"]

    async def add_expense(self, data: dict[str, Any]) -> dict[str, Any]:
        return (await self.request("POST", "/expenses", json=data))["expense"]

    async def employees(self, shop_id: str) -> list[dict[str, Any]]:
        return (await self.request("GET", "/employees", params={"shop_id": shop_id}))["employees"]

    async def add_salary_payment(self, data: dict[str, Any]) -> dict[str, Any]:
        return (await self.request("POST", "/salary-payments", json=data))["payment"]


bridge = WebBridge()
