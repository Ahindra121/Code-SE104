import Link from "next/link"

export default function PrivacyPage() {
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
                <h1 className="text-3xl font-bold text-foreground mb-4">Chính sách bảo mật</h1>
                <p className="text-muted-foreground mb-6">
                    LearnHub cam kết bảo mật thông tin cá nhân và dữ liệu người dùng theo tiêu chuẩn hiện hành.
                </p>
                <div className="space-y-6 text-base leading-7 text-foreground">
                    <section>
                        <h2 className="text-xl font-semibold mb-2">1. Thu thập thông tin</h2>
                        <p>
                            Chúng tôi thu thập thông tin cần thiết để cung cấp dịch vụ, bao gồm email, tên và dữ liệu học tập.
                        </p>
                    </section>
                    <section>
                        <h2 className="text-xl font-semibold mb-2">2. Sử dụng thông tin</h2>
                        <p>
                            Thông tin của bạn được sử dụng để nâng cao trải nghiệm học tập, hỗ trợ đăng nhập và gửi thông báo quan trọng.
                        </p>
                    </section>
                    <section>
                        <h2 className="text-xl font-semibold mb-2">3. Bảo mật</h2>
                        <p>
                            LearnHub bảo mật dữ liệu bằng các biện pháp kỹ thuật nhằm hạn chế truy cập trái phép và rò rỉ thông tin.
                        </p>
                    </section>
                </div>
            </main>
        </div>
    )
}
