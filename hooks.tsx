import { App } from "obsidian";
import { AppContext } from "./context";
import { useContext } from "react";

export const useApp = (): App | undefined => {
  return useContext(AppContext);
};
