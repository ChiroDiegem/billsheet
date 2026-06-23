import "../styles/globals.css";
import { Open_Sans } from "next/font/google";
import { MantineProvider, createEmotionCache } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import Head from "next/head";
import NavBar from "../components/NavBar";
import React, { useState } from "react";
import { Analytics } from "@vercel/analytics/next";
import { SupabaseProvider } from "../contexts/SupabaseContext";
import { createBrowserClient } from "../lib/supabase";

const open_sans = Open_Sans({ subsets: ["latin"] });

export default function App({ Component, pageProps }: any) {
  const customEmotionCache = createEmotionCache({
    key: "mantine",
    prepend: false,
  });

  // Create a new supabase browser client on every first render
  const [supabaseClient] = useState(() => createBrowserClient());

  return (
    <>
      <Head>
        <title>Chiro Diegem | Billsheet</title>
      </Head>
      <SupabaseProvider supabaseClient={supabaseClient}>
        <MantineProvider
          withCSSVariables
          withGlobalStyles
          withNormalizeCSS
          emotionCache={customEmotionCache}
          theme={{
            colorScheme: "light",
            fontFamily: "Open Sans, sans serif",
            primaryShade: { light: 5, dark: 7 },
            colors: {
              "primary-color": [
                "#e6a1a1",
                "#df8c8c",
                "#da7878",
                "#d76666",
                "#d45252",
                "#d04040",
                "#c83a3a",
                "#bf3535",
                "#b63030",
                "#ad2c2c",
              ],
            },
          }}
        >
          <main className={open_sans.className}>
            <NavBar />
            <Notifications position="top-right" />
            <Component {...pageProps} />
          </main>
        </MantineProvider>
      </SupabaseProvider>
      <Analytics />
    </>
  );
}
