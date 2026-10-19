import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config({ ignores: ["dist"] }, {
  extends: [js.configs.recommended, ...tseslint.configs.recommended],
  files: ["**/*.{ts,tsx}"],
  languageOptions: {
    ecmaVersion: 2020,
    globals: globals.browser,
  },
  plugins: {
    "react-hooks": reactHooks,
    "react-refresh": reactRefresh,
  },
  rules: {
    ...reactHooks.configs.recommended.rules,
    // Move helpers out of component files. The named exceptions keep a
    // context's hook beside its Provider (useAuth has 80+ importers) and
    // shadcn's generated ui/ helpers as shadcn ships them.
    "react-refresh/only-export-components": ["error", {
      allowConstantExport: true,
      allowExportNames: [
        "useAuth", "useParentChildren",
        "badgeVariants", "buttonVariants", "toggleVariants", "navigationMenuTriggerStyle",
        "useFormField", "useSidebar", "toast",
      ],
    }],
    "@typescript-eslint/no-unused-vars": "off",
    // Still warnings: the database-row `any`s wait on regenerated Supabase
    // types, and the hook dependencies are behaviour changes. `npm run lint`
    // caps warnings at today's count (--max-warnings), so they can only fall.
    // Lower that number when you fix some; never raise it.
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-empty-object-type": "error",
    "@typescript-eslint/no-require-imports": "error",
  },
}, {
  // The use-case harness binds each test suite to a registry entry with
  // useCase('UC-XXX', ...). The `use` prefix makes the react-hooks plugin
  // treat it as a React Hook, but it is a describe() wrapper — it is called
  // at module top level by design and never inside a component.
  files: ["tests/**/*.{ts,tsx}"],
  rules: {
    "react-hooks/rules-of-hooks": "off",
  },
});
