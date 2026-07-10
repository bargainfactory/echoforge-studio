import { en } from "./en";
import { es } from "./es";
import { fr } from "./fr";
import { de } from "./de";
import { pt } from "./pt";
import { ja } from "./ja";
import { zh } from "./zh";
import { ko } from "./ko";
import { ar } from "./ar";
import { hi } from "./hi";
import { ru } from "./ru";
import { it } from "./it";
import { id } from "./id";
import { tr } from "./tr";
import { vi } from "./vi";
import { nl } from "./nl";
import { pl } from "./pl";
import { th } from "./th";
import { zhTW } from "./zh-TW";

export const translations: Record<string, Record<string, string>> = {
  en, es, fr, de, pt, ja, zh, ko, ar, hi,
  ru, it, id, tr, vi, nl, pl, th, "zh-TW": zhTW,
};
