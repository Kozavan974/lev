# Étude technique — lire le mode « Ne pas déranger » de Windows

Lot 3. Question posée par la section 5.9 et par le point ouvert « Visioconférences » : peut-on savoir, de façon fiable sur Windows 10 et Windows 11, que la personne a activé « Ne pas déranger » (Focus Assist sur Windows 10) ?

Lèv affiche ses rappels dans sa propre fenêtre, pas dans un toast du système. Windows ne les masque donc pas tout seul. Si ce mode devait être respecté, il faudrait le lire nous-mêmes.

## Ce que `SHQueryUserNotificationState` dit vraiment

La fonction documentée (`shell32.dll`, `shellapi.h`) répond avec `QUERY_USER_NOTIFICATION_STATE`. Elle couvre le plein écran (`QUNS_BUSY`, `QUNS_RUNNING_D3D_FULL_SCREEN`), le mode présentation (`QUNS_PRESENTATION_MODE`), l'écran verrouillé et l'état ordinaire.

`QUNS_QUIET_TIME` n'est pas le mode Ne pas déranger. La documentation Microsoft le réserve à l'heure qui suit la première ouverture de session d'un compte, ou une mise à jour du système. Ce n'est pas l'interrupteur des paramètres.

Microsoft précise aussi qu'aucun message n'est envoyé quand une application entre ou sort du plein écran. D'où le sondage, limité à l'échéance d'un rappel puis toutes les 15 secondes tant qu'il est retenu.

## Pistes examinées

| Piste                                                        | Ce qu'elle lit                                                 | Fiabilité pour Lèv                                                                                                                                                                                                                                    |
| ------------------------------------------------------------ | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `QUNS_QUIET_TIME`                                            | Heure calme après une première session ou une mise à jour      | Mauvais signal. À écarter                                                                                                                                                                                                                             |
| `ToastNotificationManager.GetToastNotificationMode`          | `Unrestricted`, `PriorityOnly` ou `AlarmsOnly` pour les toasts | Documenté côté WinRT, mais conçu pour les toasts, pas pour une fenêtre Electron. Le lien avec l'interrupteur n'est pas le même sur Windows 10 et Windows 11. L'appeler depuis le processus principal demande une projection WinRT, souvent à compiler |
| `FocusSessionManager.IsFocusActive` (`Windows.UI.Shell`)     | Session de concentration                                       | Windows 11 récent seulement. Une session de concentration n'est pas le mode Ne pas déranger : l'un peut être actif sans l'autre, et le mode peut rester après la session                                                                              |
| État WNF `WNF_SHEL_QUIETHOURS_ACTIVE_PROFILE_CHANGED`        | Profil Focus Assist, par rétro-ingénierie                      | Non documenté. Peut cesser de répondre à une mise à jour                                                                                                                                                                                              |
| Valeur binaire du registre CloudStore (`quiethourssettings`) | Même réglage, format interne                                   | Non documenté. Le nom de clé et le binaire changent                                                                                                                                                                                                   |

Aucune de ces pistes n'est à la fois documentée, stable sur Windows 10 et Windows 11, et fidèle à l'interrupteur que la personne voit dans les paramètres.

## Ce que le plein écran ne voit pas

`SHQueryUserNotificationState` ne signale pas une visioconférence en fenêtre (Teams, Zoom, un navigateur qui n'est pas en plein écran). Certains jeux en fenêtré sans bord ne positionnent ni `QUNS_BUSY` ni `QUNS_RUNNING_D3D_FULL_SCREEN`. C'est la limite assumée de la section 5.9 : la mise en veille manuelle reste la réponse pour une réunion.

## Conclusion

Aucune lecture fiable du mode « Ne pas déranger » ne tient sur Windows 10 et Windows 11 sans interface non documentée, ou sans une projection WinRT dont le résultat ne correspond pas à l'interrupteur. La v1 ne le prend pas en compte.

Le lot 3 s'en tient à trois états documentés : `QUNS_BUSY`, `QUNS_RUNNING_D3D_FULL_SCREEN`, `QUNS_PRESENTATION_MODE`. L'option garde son libellé : « Ne pas me déranger en plein écran ou pendant une présentation ».

Reprendre la question supposerait une API documentée, présente sur Windows 10 et Windows 11, qui reflète cet interrupteur et soit appelable sans compilation depuis le processus principal.
