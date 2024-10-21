import SecurityViews from "@/components/components/settings/SecurityView";
import React from "react";

const SettingsPage = ({
  user,
  jwt,
  session,
}: {
  user: any;
  jwt: string;
  session: any;
}) => {
  return (
    <main className="min-h-screen w-full bg-white max-w-[1000px] mx-auto p-10">
      <SecurityViews credentials={session} />
    </main>
  );
};

export default SettingsPage;
