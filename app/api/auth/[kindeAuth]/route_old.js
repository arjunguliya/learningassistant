import {handleAuth} from "@kinde-oss/kinde-auth-nextjs/server";

export const GET = handleAuth();

import {RegisterLink, LoginLink} from "@kinde-oss/kinde-auth-nextjs/components";

<LoginLink>Sign in</LoginLink>

<RegisterLink>Sign up</RegisterLink>
