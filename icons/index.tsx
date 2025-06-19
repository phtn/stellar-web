"use client";

import type { FC } from "react";
import { icons, IconNameType } from "./icons";
import type { IconData, IconProps } from "./types";

export type IconName = IconNameType;

export const Icon: FC<IconProps> = ({
  name,
  className,
  size = 24,
  color = "currentColor",
  solid = false,
  ...props
}) => {
  const icon = icons[name] as IconData;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={icon.viewBox ?? "0 0 24 24"}
      width={size}
      height={size}
      className={className}
      fill={solid ? color : "none"}
      stroke={solid ? "none" : color}
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
      dangerouslySetInnerHTML={{ __html: icon.symbol }}
    />
  );
};
