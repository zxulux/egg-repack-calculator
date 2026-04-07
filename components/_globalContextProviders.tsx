import { ReactNode } from "react";
import { Helmet } from "react-helmet";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeModeProvider } from "../helpers/themeMode";
import { TooltipProvider } from "./Tooltip";
import { SonnerToaster } from "./SonnerToaster";
import { ScrollToHashElement } from "./ScrollToHashElement";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute “fresh” window
    },
  },
});

export const GlobalContextProviders = ({
  children,
}: {
  children: ReactNode;
}) => {
  return (
    <QueryClientProvider client={queryClient}>
      <Helmet>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#f59e0b" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Egg Repack" />
      </Helmet>
      <ThemeModeProvider>
        <ScrollToHashElement />
        <TooltipProvider>
          {children}
          <SonnerToaster />
        </TooltipProvider>
      </ThemeModeProvider>
    </QueryClientProvider>
  );
};
