import Link from "next/link"

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-background">
            <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <Link href="/" className="font-semibold text-foreground">
                        LearnHub
                    </Link>
                    <Link href="/register" className="text-sm text-muted-foreground hover:text-foreground">
                        Quay lại đăng ký
                    </Link>
                </div>
            </header>
            <main className="container mx-auto px-4 py-12">
                <h1 className="text-3xl font-bold text-foreground mb-4">Điều khoản dịch vụ</h1>
                <p className="text-muted-foreground mb-6">
                    Chào mừng bạn đến với LearnHub. Khi sử dụng nền tảng này, bạn đồng ý với các điều khoản sau.
                </p>
                <div className="space-y-6 text-base leading-7 text-foreground">
                    <section>
                        <h2 className="text-xl font-semibold mb-2">1. Quyền truy cập</h2>
                        <p>
                            Người dùng được phép truy cập nội dung giáo dục, tài liệu và các công cụ hỗ trợ học tập theo quy định của LearnHub.
                        </p>
                    </section>
                    <section>
                        <h2 className="text-xl font-semibold mb-2">2. Hành vi người dùng</h2>
                        <p>
                            Người dùng cam kết không đăng tải nội dung vi phạm pháp luật, xâm phạm bản quyền hoặc gây phương hại đến cộng đồng.
                        </p>
                    </section>
                    <section>
                        <h2 className="text-xl font-semibold mb-2">3. Bản quyền</h2>
                        <p>
                            Toàn bộ nội dung trên LearnHub được bảo hộ bản quyền. Không được sao chép, phân phối hoặc sử dụng trái phép.
                        </p>
                    </section>
                </div>
            </main>
        </div>
    )
}
