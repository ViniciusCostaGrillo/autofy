# Play Store Release Checklist

## Build Identity

- Confirmar `android.package`: `com.viniciuscostagrillo.autofy`
- Confirmar `android.versionCode` incremental antes de cada envio
- Confirmar `expo.version` para a versão pública do app

## Secrets e Backend

- Definir `OPENROUTESERVICE_API_KEY` no Supabase
- Definir `APP_ORIGIN` no Supabase se houver uso web
- Confirmar que `route-estimate` e `route-places` estão deployadas

## Segurança

- Validar que o botão de `admin de teste` não aparece em build de produção
- Validar login por OTP real
- Validar logout e expiração de sessão
- Revisar políticas RLS no Supabase antes do envio

## Android Release

- Rodar `eas build --platform android --profile production`
- Subir o `.aab` gerado na Google Play Console
- Preencher `Data safety`
- Informar política de privacidade
- Revisar classificação etária, contato e capturas de tela

## Verificação Final

- Rodar `npm run typecheck`
- Rodar `npx expo export --platform android`
- Testar fluxo completo em build release interna
