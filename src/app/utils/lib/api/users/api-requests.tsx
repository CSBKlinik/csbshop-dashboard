interface LoginParams {
  identifier: string | undefined;
  password: string | undefined;
}
export async function loginLib(params: LoginParams) {
  try {
    const user = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/auth/local`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      }
    );
    const data = await user.json();
    console.log("data:", data);
    // @ts-ignore
    return data;
  } catch (error) {
    return error;
  }
}