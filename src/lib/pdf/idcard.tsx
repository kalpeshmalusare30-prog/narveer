import path from "node:path";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
  renderToBuffer,
} from "@react-pdf/renderer";

// Noto Sans Devanagari covers Latin + Devanagari, so one family renders both
// English and Marathi ID cards.
Font.register({
  family: "Noto",
  fonts: [
    {
      src: path.join(process.cwd(), "public/fonts/NotoSansDevanagari-Regular.ttf"),
      fontWeight: 400,
    },
    {
      src: path.join(process.cwd(), "public/fonts/NotoSansDevanagari-Bold.ttf"),
      fontWeight: 700,
    },
  ],
});

// CR80 landscape card size (3.375in x 2.125in) in points.
const CARD_WIDTH = 243;
const CARD_HEIGHT = 153;

const styles = StyleSheet.create({
  page: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    padding: 10,
    fontFamily: "Noto",
    fontSize: 7,
    color: "#0f172a",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderBottomWidth: 1.5,
    borderBottomColor: "#e0400f",
    paddingBottom: 5,
    marginBottom: 6,
  },
  logo: { width: 22, height: 22, objectFit: "contain" },
  orgName: { fontSize: 8.5, fontWeight: 700, flex: 1 },
  body: { flexDirection: "row", gap: 8, flexGrow: 1 },
  photo: {
    width: 58,
    height: 72,
    objectFit: "cover",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  photoPlaceholder: {
    width: 58,
    height: 72,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#f1f5f9",
  },
  details: { flex: 1, justifyContent: "center", gap: 4 },
  name: { fontSize: 9, fontWeight: 700, marginBottom: 2 },
  row: { flexDirection: "row" },
  label: { width: 44, color: "#64748b", fontSize: 6.5 },
  value: { flex: 1, fontSize: 7, fontWeight: 700 },
});

type Lang = "en" | "mr";
const L: Record<Lang, Record<string, string>> = {
  en: { memberId: "Member ID", area: "Area" },
  mr: { memberId: "सभासद क्र.", area: "विभाग" },
};

export type IdCardPdfData = {
  locale: string;
  org: {
    name: string;
    logoDataUri?: string;
  };
  member: {
    name: string;
    memberCode: string;
    area?: string | null;
    photoDataUri?: string | null;
  };
};

export async function renderIdCardPdf(d: IdCardPdfData): Promise<Buffer> {
  const t = L[(d.locale === "mr" ? "mr" : "en") as Lang];
  const doc = (
    <Document>
      <Page size={[CARD_WIDTH, CARD_HEIGHT]} style={styles.page}>
        <View style={styles.header}>
          {d.org.logoDataUri ? (
            <Image style={styles.logo} src={d.org.logoDataUri} />
          ) : null}
          <Text style={styles.orgName}>{d.org.name}</Text>
        </View>
        <View style={styles.body}>
          {d.member.photoDataUri ? (
            <Image style={styles.photo} src={d.member.photoDataUri} />
          ) : (
            <View style={styles.photoPlaceholder} />
          )}
          <View style={styles.details}>
            <Text style={styles.name}>{d.member.name}</Text>
            <View style={styles.row}>
              <Text style={styles.label}>{t.memberId}</Text>
              <Text style={styles.value}>{d.member.memberCode}</Text>
            </View>
            {d.member.area ? (
              <View style={styles.row}>
                <Text style={styles.label}>{t.area}</Text>
                <Text style={styles.value}>{d.member.area}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </Page>
    </Document>
  );
  return renderToBuffer(doc);
}
