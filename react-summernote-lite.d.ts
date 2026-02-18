declare module "react-summernote-lite" {
  import { ComponentType } from "react";
  interface SummernoteLiteProps {
    ref?: React.Ref<{ summernote: (cmd: string, ...args: unknown[]) => void } | null>;
    key?: string;
    defaultCodeValue?: string;
    placeholder?: string;
    tabsize?: number;
    height?: number | string;
    dialogsInBody?: boolean;
    toolbar?: (string | string[])[][];
    callbacks?: {
      onChange?: (contents: string) => void;
      onImageUpload?: (files: File[]) => void;
      onKeyup?: (e: unknown) => void;
      onKeyDown?: (e: unknown) => void;
      onPaste?: (e: unknown) => void;
    };
  }
  const SummernoteLite: ComponentType<SummernoteLiteProps>;
  export default SummernoteLite;
}
