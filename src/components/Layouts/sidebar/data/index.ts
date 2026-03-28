import * as Icons from "../icons";

export const NAV_DATA = [
  {
    label: "MENU PRINCIPAL",
    items: [
      {
        title: "Vue d'ensemble",
        url: "/",
        icon: Icons.HomeIcon,
        items: [],
      },
      {
        title: "Programmes",
        url: "/programmes",
        icon: Icons.Calendar,
        items: [],
      },
      {
        title: "Annuaire des Âmes",
        url: "/ames",
        icon: Icons.BookOpen,
        items: [],
      },
      {
        title: "Équipe",
        url: "/equipe",
        icon: Icons.UsersGroup,
        items: [],
      },
      {
        title: "Terrain",
        url: "/terrain",
        icon: Icons.MapPin,
        items: [],
      },
      {
        title: "Mon Profil",
        url: "/profile",
        icon: Icons.User,
        items: [],
      },
      {
        title: "Notifications",
        url: "/parametres/notifications",
        icon: Icons.BellSettings,
        items: [],
      },
    ],
  },
];
