import 'tailwindcss/types/config';

declare module 'tailwindcss/types/config' {
  interface PluginAPI {
    daisyui?: {
      themes?: boolean | string[] | [string, any][];
      darkTheme?: string | boolean;
      base?: boolean;
      styled?: boolean;
      utils?: boolean;
      logs?: boolean;
      prefix?: string;
    };
  }
}
