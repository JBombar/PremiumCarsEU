import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

import DealerClientLayout from "@/components/dealer/DealerClientLayout"; // ✅ Use existing client wrapper
import type { Database } from "@/types/supabase";

export const metadata = {
    title: "Dealer Admin | PremiumCarsEU",
    description: "Partner Dealer Dashboard",
};

export default async function DealerAdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookies().get(name)?.value;
                },
                set(name: string, value: string, options: CookieOptions) {
                    cookies().set({ name, value, ...options });
                },
                remove(name: string, options: CookieOptions) {
                    cookies().set({ name, value: "", ...options });
                },
            },
        }
    );

    const {
        data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
        return redirect("/login?callbackUrl=/dealer-admin");
    }

    const { data: dealerPartner } = await supabase
        .from("dealer_partners")
        .select("*")
        .eq("dealer_user_id", session.user.id)
        .single();

    if (!dealerPartner) {
        return redirect("/");
    }

    return <DealerClientLayout>{children}</DealerClientLayout>;
}
