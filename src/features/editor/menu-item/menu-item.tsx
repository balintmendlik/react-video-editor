import useLayoutStore from "../store/use-layout-store";
import { Captions } from "./captions";
import { useIsLargeScreen } from "@/hooks/use-media-query";
import { Uploads } from "./uploads";

const ActiveMenuItem = () => {
  const { activeMenuItem } = useLayoutStore();

  if (activeMenuItem === "uploads") {
    return <Uploads />;
  }
  if (activeMenuItem === "captions") {
    return <Captions />;
  }

  return null;
};

export const MenuItem = () => {
  const isLargeScreen = useIsLargeScreen();

  return (
    <div className={`${isLargeScreen ? "w-[300px]" : "w-full"} flex-1 flex`}>
      <ActiveMenuItem />
    </div>
  );
};
