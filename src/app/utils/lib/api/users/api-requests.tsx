interface LoginParams {
  identifier: string | undefined;
  password: string | undefined;
}

export async function loginLib(params: LoginParams) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) throw new Error("AuthConfiguration");
  let response: Response;
  try {
    response = await fetch(`${apiUrl.replace(/\/$/, "")}/api/auth/local`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    throw new Error("AuthUnavailable");
  }
  if ([400, 401, 403].includes(response.status)) return null;
  if (!response.ok) throw new Error("AuthUnavailable");
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error("AuthUnavailable");
  }
  if (!data?.jwt || !data?.user?.id || !data?.user?.email) {
    throw new Error("AuthInvalidResponse");
  }
  return data;
}
