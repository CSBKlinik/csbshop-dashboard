export class DashboardDataError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
  }
}

export async function fetchDashboardData(
  path: string,
  jwt?: string,
  options: { anonymous?: boolean } = {},
) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) throw new DashboardDataError("Le service est mal configuré. Contactez l’administrateur.");
  if (!jwt && !options.anonymous) throw new DashboardDataError("Votre session a expiré. Veuillez vous reconnecter.", 401);
  let response: Response;
  try {
    response = await fetch(`${apiUrl.replace(/\/$/, "")}${path}`, {
      headers: options.anonymous ? {} : { Authorization: `Bearer ${jwt}` },
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    throw new DashboardDataError("Impossible de joindre le serveur. Réessayez dans un instant.");
  }
  if (response.status === 401) {
    throw new DashboardDataError("Votre session a expiré. Veuillez vous reconnecter.", 401);
  }
  if (response.status === 403) {
    throw new DashboardDataError("Votre compte n’a pas accès à ces données. Contactez l’administrateur.", 403);
  }
  if (!response.ok) throw new DashboardDataError("Impossible de charger les données. Réessayez dans un instant.");
  try {
    return await response.json();
  } catch {
    throw new DashboardDataError("Le serveur a renvoyé une réponse invalide. Réessayez dans un instant.");
  }
}
