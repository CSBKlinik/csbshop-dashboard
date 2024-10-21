import { authOptions } from "@/app/utils/lib/context/authOptions";
import SettingsPage from "@/components/pages/laboratories/SettingsPage";
import { getServerSession } from "next-auth";
import React from "react";

const Setting = async () => {
  const session = await getServerSession(authOptions);
  const getUser = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/users/me?populate=*`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        //   @ts-ignore
        Authorization: `Bearer ${session?.user?.jwt}`,
      },
    }
  );
  const userInfos = await getUser.json();
  return (
    // @ts-ignore
    <SettingsPage user={userInfos} jwt={session?.user?.jwt} session={session} />
  );
};

export default Setting;
