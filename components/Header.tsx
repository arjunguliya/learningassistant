import { LoginLink, RegisterLink, LogoutLink } from "@kinde-oss/kinde-auth-nextjs/components";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import Image from "next/image";

const Header = async () => {
  const { isAuthenticated, getUser } = getKindeServerSession();
  const user = await getUser();

  return (
    <div className="container flex h-[60px] shrink-0 items-center justify-between px-4 lg:h-[80px] lg:px-0">
      <a href="/">
        <Image
          unoptimized
          src="/new-logo.svg"
          alt="Logo"
          width={120}
          height={36}
          className="w-30 sm:w-36"
        />  
      </a>
      
      <div className="flex items-center gap-4">
        {!(await isAuthenticated()) ? (
          <>
            <LoginLink className="rounded-md bg-[#5170ff] px-4 py-2 text-sm font-medium text-white hover:bg-[#4060e6]">
              Sign in
            </LoginLink>
            <RegisterLink className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Sign up
            </RegisterLink>
          </>
        ) : (
          <div className="flex items-center gap-4">
            {user?.picture ? (
              <img 
                className="h-8 w-8 rounded-full" 
                src={user.picture} 
                alt="User profile" 
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white text-sm font-medium">
                {user?.given_name?.[0]}{user?.family_name?.[0]}
              </div>
            )}
            <span className="text-sm text-gray-700">
              {user?.given_name} {user?.family_name}
            </span>
            <LogoutLink className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Logout
            </LogoutLink>
          </div>
        )}
      </div>
    </div>
  );
};

export default Header;
