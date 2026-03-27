export async function sendMessageAPI(userId, message) {
  const res = await fetch("/api/ask-ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, message }),
  })

  const data = await res.json()
  return data
}