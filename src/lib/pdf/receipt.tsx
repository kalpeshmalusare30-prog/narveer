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
// English and Marathi receipts.
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

const styles = StyleSheet.create({
  page: { padding: 36, fontFamily: "Noto", fontSize: 10, color: "#0f172a" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomWidth: 2,
    borderBottomColor: "#e0400f",
    paddingBottom: 10,
    marginBottom: 14,
  },
  logo: { width: 46, height: 46, objectFit: "contain" },
  orgName: { fontSize: 15, fontWeight: 700 },
  orgMeta: { fontSize: 9, color: "#475569" },
  title: {
    fontSize: 13,
    fontWeight: 700,
    textAlign: "center",
    marginBottom: 12,
  },
  row: { flexDirection: "row", marginBottom: 4 },
  label: { width: 130, color: "#64748b" },
  value: { flex: 1, fontWeight: 700 },
  table: { marginTop: 12, borderWidth: 1, borderColor: "#e2e8f0" },
  tr: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  th: {
    flex: 1,
    padding: 6,
    fontWeight: 700,
    backgroundColor: "#f1f5f9",
  },
  td: { flex: 1, padding: 6 },
  totalRow: { flexDirection: "row", marginTop: 8, justifyContent: "flex-end" },
  totalLabel: { fontWeight: 700, marginRight: 12 },
  totalValue: { fontWeight: 700, fontSize: 12 },
  footer: {
    marginTop: 40,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sign: { fontSize: 9, color: "#475569" },
});

type Lang = "en" | "mr";
const L: Record<Lang, Record<string, string>> = {
  en: {
    receipt: "PAYMENT RECEIPT",
    number: "Receipt No.",
    date: "Date",
    member: "Member",
    memberId: "Member ID",
    mode: "Mode",
    reference: "Reference",
    year: "Financial Year",
    amount: "Amount",
    total: "Total",
    collectedBy: "Collected by",
    authorized: "Authorized signatory",
    rupees: "₹",
  },
  mr: {
    receipt: "पावती",
    number: "पावती क्र.",
    date: "दिनांक",
    member: "सभासद",
    memberId: "सभासद क्र.",
    mode: "पद्धत",
    reference: "संदर्भ",
    year: "आर्थिक वर्ष",
    amount: "रक्कम",
    total: "एकूण",
    collectedBy: "स्वीकारकर्ता",
    authorized: "अधिकृत स्वाक्षरी",
    rupees: "₹",
  },
};

export type ReceiptPdfData = {
  locale: string;
  org: {
    name: string;
    address?: string | null;
    city?: string | null;
    contactNumber?: string | null;
    email?: string | null;
    logoDataUri?: string;
  };
  receiptNumber: string;
  receiptDate: string;
  memberName: string;
  memberCode: string;
  modeName: string;
  referenceNumber?: string | null;
  collectedByName?: string | null;
  lines: { yearLabel: string; amount: string }[];
  total: string;
};

function fmt(amount: string) {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount));
}

export async function renderReceiptPdf(d: ReceiptPdfData): Promise<Buffer> {
  const t = L[(d.locale === "mr" ? "mr" : "en") as Lang];
  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          {d.org.logoDataUri ? (
            <Image style={styles.logo} src={d.org.logoDataUri} />
          ) : null}
          <View>
            <Text style={styles.orgName}>{d.org.name}</Text>
            <Text style={styles.orgMeta}>
              {[d.org.address, d.org.city].filter(Boolean).join(", ")}
            </Text>
            <Text style={styles.orgMeta}>
              {[d.org.contactNumber, d.org.email].filter(Boolean).join(" • ")}
            </Text>
          </View>
        </View>

        <Text style={styles.title}>{t.receipt}</Text>

        <View style={styles.row}>
          <Text style={styles.label}>{t.number}</Text>
          <Text style={styles.value}>{d.receiptNumber}</Text>
          <Text style={styles.label}>{t.date}</Text>
          <Text style={styles.value}>{d.receiptDate}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>{t.member}</Text>
          <Text style={styles.value}>{d.memberName}</Text>
          <Text style={styles.label}>{t.memberId}</Text>
          <Text style={styles.value}>{d.memberCode}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>{t.mode}</Text>
          <Text style={styles.value}>{d.modeName}</Text>
          <Text style={styles.label}>{t.reference}</Text>
          <Text style={styles.value}>{d.referenceNumber || "-"}</Text>
        </View>

        <View style={styles.table}>
          <View style={styles.tr}>
            <Text style={styles.th}>{t.year}</Text>
            <Text style={styles.th}>{t.amount}</Text>
          </View>
          {d.lines.map((ln, i) => (
            <View style={styles.tr} key={i}>
              <Text style={styles.td}>{ln.yearLabel}</Text>
              <Text style={styles.td}>
                {t.rupees}
                {fmt(ln.amount)}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>{t.total}</Text>
          <Text style={styles.totalValue}>
            {t.rupees}
            {fmt(d.total)}
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.sign}>
            {t.collectedBy}: {d.collectedByName || "-"}
          </Text>
          <Text style={styles.sign}>{t.authorized}</Text>
        </View>
      </Page>
    </Document>
  );
  return renderToBuffer(doc);
}
