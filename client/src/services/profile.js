export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"

export const getProfile = async () => {
  const token = localStorage.getItem("token")

  const res = await fetch(`${API_URL}/api/auth/me`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  })

  if (!res.ok) {
    throw new Error("Failed to fetch profile")
  }

  return res.json()
}