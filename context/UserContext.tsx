import { useEffect, useState, createContext } from "react";
import {
  useUser as useSupaUser,
  useSessionContext,
} from "@supabase/auth-helpers-react";
import { IUserDetails } from "../interfaces";

type UserContextType = {
  user: IUserDetails | null;
};

export const UserContext = createContext<UserContextType | undefined>(
  undefined
);

export interface Props {
  [propName: string]: any;
}

const UserContextProvider = (props: Props) => {
  const { isLoading, supabaseClient: supabase } = useSessionContext();
  const user = useSupaUser();
  const [userDetails, setUserDetails] = useState<IUserDetails | null>(null);

  useEffect(() => {
    if (user) {
      supabase
        .from("profiles")
        .select("subscriptionActive, subscriptionExpiry, role")
        .eq("id", user?.id)
        .single()
        .then(({ data, error }) => {
          if (error) {
            setUserDetails({
              ...user,
              subscriptionActive: false,
              subscriptionExpiry: "",
              role: "user",
            });
            return;
          }
          setUserDetails({
            ...user,
            subscriptionActive: data.subscriptionActive,
            subscriptionExpiry: data.subscriptionExpiry,
            role: data.role,
          });
        });
    } else if (!user && !isLoading) {
      setUserDetails(null);
    }
  }, [user, isLoading, supabase]);

  const value = {
    user: userDetails,
  };

  return <UserContext.Provider value={value} {...props} />;
};

export default UserContextProvider;
