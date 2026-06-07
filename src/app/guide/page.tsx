import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Clock3,
  FolderOpen,
  MonitorPlay,
  Sparkles,
  Users,
  Wand2,
} from "lucide-react";

const quickStart = [
  {
    title: "Siapkan akun AI",
    description: "Masuk ke menu Accounts, lalu pastikan minimal ada 1 akun ChatGPT dan 1 akun Gemini berstatus active.",
  },
  {
    title: "Buat project produk",
    description: "Masuk ke Projects, buat nama project yang jelas, isi deskripsi singkat, lalu upload foto produk yang akan dipakai.",
  },
  {
    title: "Buat storyboard per angle",
    description: "Masuk ke Projects lalu buat banyak storyboard di dalam 1 project. Misalnya: Hook Reveal, Testimoni, Problem-Solution, UGC, Wudhu Friendly.",
  },
  {
    title: "Generate dari storyboard",
    description: "Masuk ke Generate, pilih project, pilih storyboard, lalu baru pilih tipe konten dan isi prompt.",
  },
  {
    title: "Lanjutkan ke video",
    description: "Kalau storyboard sudah oke, generate video 10 detik dari project yang sama agar alurnya konsisten dan sesuai limit Veo.",
  },
];

const teamRoles = [
  {
    role: "Admin akun",
    owner: "PIC teknis / operator senior",
    tasks: [
      "Menambah akun ChatGPT dan Gemini",
      "Menjaga status akun tetap active",
      "Memantau quota dan reset usage bila perlu",
    ],
  },
  {
    role: "Operator konten",
    owner: "Tim content creation",
    tasks: [
      "Membuat project per produk atau campaign",
      "Upload asset produk dan isi brand notes",
      "Menjalankan generation storyboard dan video",
    ],
  },
  {
    role: "QC / approver",
    owner: "Lead content / owner",
    tasks: [
      "Review hasil generate",
      "Cek apakah angle, tone, dan CTA sudah sesuai",
      "Tentukan hasil mana yang lanjut dipakai tim posting",
    ],
  },
];

const workflow = [
  {
    step: "1. Cek kesehatan sistem",
    detail: "Mulai dari menu Monitoring dan Dashboard. Pastikan account aktif tersedia dan tidak ada quota yang hampir habis.",
    tip: "Kalau account tinggal sedikit, isi atau aktifkan cadangan dulu sebelum tim mulai kerja.",
  },
  {
    step: "2. Siapkan bahan per project",
    detail: "Masuk ke Projects lalu buat 1 project untuk 1 produk, 1 tema campaign, atau 1 batch konten yang seragam.",
    tip: "Gunakan nama project yang mudah dicari, misalnya: `Gamis Aero - Launch Juni`.",
  },
  {
    step: "3. Upload visual dan brand notes",
    detail: "Masukkan foto produk terbaik, lalu isi deskripsi singkat, USP produk, target audience, dan gaya komunikasi brand.",
    tip: "Semakin jelas catatan brand, semakin rapi output yang dihasilkan.",
  },
  {
    step: "4. Buat storyboard per angle",
    detail: "Masuk ke halaman Storyboards di dalam project, lalu buat banyak storyboard untuk tiap angle, campaign, atau pillar konten yang mau diuji.",
    tip: "Ini sangat cocok buat testing: misalnya 1 project bisa punya 50 storyboard berbeda sebelum tim tahu mana yang paling bagus.",
  },
  {
    step: "5. Generate dari storyboard",
    detail: "Di menu Generate, pilih project lalu pilih storyboard. Hasil generate akan masuk ke storyboard yang sama supaya gampang dibandingkan.",
    tip: "Kalau mau cari mana angle terbaik, jangan campur banyak angle dalam 1 storyboard. Pisahkan tiap konsep ke storyboard berbeda.",
  },
  {
    step: "6. Review dan bandingkan per storyboard",
    detail: "Cek hasil di History. Kalau angle belum tepat, revisi prompt atau brand notes, lalu generate ulang dari storyboard yang sama.",
    tip: "Ubah 1-2 variabel saja per percobaan supaya tim tahu mana yang bikin hasil membaik.",
  },
  {
    step: "7. Perbanyak konten dari angle yang menang",
    detail: "Kalau satu atau beberapa storyboard terasa paling responsif, buat turunan atau batch lanjutan dari konsep yang sama.",
    tip: "Di sinilah pola 1 produk banyak storyboard sangat kuat: hasil terbaik bisa dilanjut, sisanya cukup diarsipkan.",
  },
  {
    step: "8. Generate video final",
    detail: "Setelah storyboard terbaik lolos QC, generate versi video 10 detik dari project dan arahan yang sama agar hasil lebih konsisten.",
    tip: "Gunakan prompt final yang sudah lulus QC, fokus ke 2-3 beat utama saja karena limit Veo saat ini 10 detik.",
  },
  {
    step: "9. Simpan hasil terbaik",
    detail: "Ambil output terbaik, pindahkan ke workflow editing/posting tim, lalu catat mana prompt dan storyboard yang paling efektif.",
    tip: "Hasil yang bagus sebaiknya dipakai ulang sebagai template untuk batch berikutnya.",
  },
];

const pageGuide = [
  {
    page: "Dashboard",
    purpose: "Lihat gambaran umum akun, jumlah project, dan aktivitas terbaru.",
    action: "Dipakai saat briefing pagi dan cek kondisi sebelum tim mulai generate.",
  },
  {
    page: "Accounts",
    purpose: "Kelola akun ChatGPT/Gemini dan pantau penggunaan.",
    action: "Dipakai admin akun untuk aktif/nonaktif akun, isi cookie, dan atur kuota.",
  },
  {
    page: "Projects",
    purpose: "Tempat menyusun bahan mentah per produk atau campaign.",
    action: "Dipakai operator untuk upload foto, isi notes, dan merapikan kerja per batch.",
  },
  {
    page: "Storyboards",
    purpose: "Memecah banyak angle/campaign di dalam 1 produk yang sama.",
    action: "Dipakai saat tim mau testing banyak konsep konten dalam 1 project, misalnya 10-50 angle berbeda.",
  },
  {
    page: "Generate",
    purpose: "Menjalankan proses pembuatan storyboard dan video.",
    action: "Dipakai setelah project dan storyboard siap, lalu pilih storyboard mana yang mau dijalankan.",
  },
  {
    page: "History",
    purpose: "Melihat hasil generation yang sudah pernah dijalankan.",
    action: "Dipakai untuk review output, membandingkan hasil, dan mencari file yang mau dipakai.",
  },
  {
    page: "Monitoring",
    purpose: "Memantau status proses dan kesehatan operasional.",
    action: "Dipakai kalau ada generation yang terasa lambat, gagal, atau kualitas hasil menurun.",
  },
];

const bestPractices = [
  "Selalu pisahkan project per produk atau per campaign agar hasil dan arsip tidak campur.",
  "Di dalam 1 project, buat banyak storyboard untuk tiap angle, pillar, atau campaign berbeda.",
  "Mulai dari storyboard dulu, baru lanjut video. Ini paling hemat waktu untuk tim review.",
  "Tulis brand notes dengan bahasa singkat tapi tegas: target audience, tone, USP, CTA.",
  "Kalau hasil belum sesuai, ubah prompt atau notes sedikit demi sedikit. Hindari ubah semuanya sekaligus.",
  "Kalau satu angle sudah menang di respons audience, perbanyak variasi dari angle itu, lalu baru test produk lain.",
  "Simpan prompt dan storyboard yang perform bagus sebagai referensi batch berikutnya.",
];

const troubleshooting = [
  {
    problem: "Account tidak bisa dipakai",
    solution: "Buka Accounts, cek status masih active atau tidak. Jika usage terlalu tinggi, reset atau ganti akun cadangan.",
  },
  {
    problem: "Hasil generation kurang sesuai",
    solution: "Perjelas brand notes, target audience, dan format output yang diinginkan. Untuk video, padatkan angle jadi 2-3 beat utama karena Veo saat ini maksimal 10 detik.",
  },
  {
    problem: "Proses terasa macet",
    solution: "Cek Monitoring dan History. Jika tidak ada progres, ulangi generate setelah memastikan akun aktif tersedia.",
  },
  {
    problem: "Tim bingung mulai dari mana",
    solution: "Ikuti urutan baku: Accounts -> Projects -> Storyboards -> Generate -> Review -> Perbanyak angle menang -> Generate video -> History.",
  },
];

export default function GuidePage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <Badge variant="secondary" className="w-fit gap-1">
            <BookOpen className="h-3.5 w-3.5" />
            Panduan Operasional Tim
          </Badge>
          <div>
            <h1 className="text-3xl font-bold">Panduan Lengkap Pakai Zaneva AI Studio</h1>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              Halaman ini dibuat supaya tim bisa langsung praktik tanpa bingung. Ikuti alur kerja
              dari atas ke bawah, lalu pakai checklist ini sebagai SOP internal harian.
            </p>
          </div>
        </div>

        <Card className="max-w-md border-primary/20 bg-primary/5">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <Sparkles className="mt-0.5 h-5 w-5 text-primary" />
              <div className="space-y-1">
                <p className="text-sm font-semibold">Urutan paling aman untuk tim</p>
                <p className="text-sm text-muted-foreground">
                  Accounts {"->"} Projects {"->"} Generate storyboard {"->"} Review {"->"} Generate video {"->"} History
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {quickStart.map((item) => (
          <Card key={item.title}>
            <CardHeader>
              <CardTitle className="text-base">{item.title}</CardTitle>
              <CardDescription>{item.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock3 className="h-5 w-5" />
              Workflow Harian Tim
            </CardTitle>
            <CardDescription>
              Gunakan urutan ini setiap kali tim mau memproses batch konten baru.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {workflow.map((item) => (
              <div key={item.step} className="rounded-xl border p-4">
                <div className="space-y-2">
                  <h3 className="font-semibold">{item.step}</h3>
                  <p className="text-sm text-muted-foreground">{item.detail}</p>
                  <div className="rounded-lg bg-muted/60 px-3 py-2 text-sm">
                    <span className="font-medium">Tips praktik:</span> {item.tip}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Pembagian Peran Tim
            </CardTitle>
            <CardDescription>
              Biar kerja tidak tumpang tindih, pakai pembagian peran sederhana ini.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {teamRoles.map((item) => (
              <div key={item.role} className="rounded-xl border p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h3 className="font-semibold">{item.role}</h3>
                  <Badge variant="outline">{item.owner}</Badge>
                </div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  {item.tasks.map((task) => (
                    <div key={task} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                      <span>{task}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MonitorPlay className="h-5 w-5" />
              Fungsi Setiap Halaman
            </CardTitle>
            <CardDescription>
              Ringkasan cepat supaya tim tahu harus buka halaman mana untuk kebutuhan tertentu.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {pageGuide.map((item) => (
              <div key={item.page} className="rounded-xl border p-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold">{item.page}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{item.purpose}</p>
                  <div className="rounded-lg bg-muted/60 px-3 py-2 text-sm">
                    <span className="font-medium">Dipakai saat:</span> {item.action}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5" />
              Best Practice Biar Hasil Konsisten
            </CardTitle>
            <CardDescription>
              Ini kebiasaan kerja yang paling membantu saat tim mulai rutin memakai app.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {bestPractices.map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-xl border p-4">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                <p className="text-sm text-muted-foreground">{item}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Troubleshooting Cepat
            </CardTitle>
            <CardDescription>
              Kalau tim mentok, cek ini dulu sebelum lapor ke admin teknis.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {troubleshooting.map((item) => (
              <div key={item.problem} className="rounded-xl border p-4">
                <p className="font-medium">{item.problem}</p>
                <p className="mt-2 text-sm text-muted-foreground">{item.solution}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
