
import Link from "next/link"
import type { ReactNode } from "react"

function PolicySection({ title, children }: { title: string; children: ReactNode }) {
    return (
        <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">{title}</h2>
            <div className="space-y-3 text-muted-foreground">{children}</div>
        </section>
    )
}

function BulletList({ children }: { children: ReactNode }) {
    return <ul className="list-disc space-y-2 pl-6">{children}</ul>
}

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-background">
            <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur">
                <div className="container mx-auto flex items-center justify-between px-4 py-4">
                    <Link href="/" className="font-semibold text-foreground">
                        LearnHub
                    </Link>
                    <Link href="/register" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                        Quay lại đăng ký
                    </Link>
                </div>
            </header>

            <main className="container mx-auto max-w-4xl px-4 py-12">
                <div className="mb-10">
                    <p className="mb-3 text-sm font-medium uppercase tracking-wide text-primary">
                        LearnHub
                    </p>
                    <h1 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
                        Chính sách bảo mật
                    </h1>
                    <p className="mb-2 text-sm text-muted-foreground">
                        Cập nhật lần cuối: 31/05/2026
                    </p>
                    <p className="text-base leading-7 text-muted-foreground">
                        LearnHub tôn trọng quyền riêng tư của người dùng và cam kết xử lý thông tin cá nhân
                        một cách minh bạch, an toàn, phù hợp với mục đích cung cấp nền tảng học trực tuyến
                        và quy định pháp luật Việt Nam áp dụng.
                    </p>
                </div>

                <div className="space-y-10 text-base leading-7">
                    <PolicySection title="1. Phạm vi áp dụng">
                        <p>
                            Chính sách này áp dụng đối với dữ liệu cá nhân được thu thập và xử lý khi bạn
                            truy cập, đăng ký, đăng nhập hoặc sử dụng các chức năng của LearnHub với tư cách
                            khách truy cập, học viên, giảng viên hoặc quản trị viên.
                        </p>
                        <p>
                            Đơn vị vận hành nền tảng được hiển thị dưới tên LearnHub. Mọi yêu cầu liên quan
                            đến dữ liệu cá nhân có thể gửi đến email{" "}
                            <a
                                href="mailto:24520016@gm.uit.edu.vn"
                                className="font-medium text-primary underline-offset-4 hover:underline"
                            >
                                24520016@gm.uit.edu.vn
                            </a>
                            .
                        </p>
                    </PolicySection>

                    <PolicySection title="2. Dữ liệu LearnHub thu thập">
                        <h3 className="font-medium text-foreground">2.1. Thông tin tài khoản và hồ sơ</h3>
                        <BulletList>
                            <li>Họ tên, tên đăng nhập, email và số điện thoại.</li>
                            <li>Ảnh đại diện và phần giới thiệu bản thân nếu người dùng cung cấp.</li>
                            <li>
                                Mật khẩu được hệ thống lưu trữ ở dạng đã băm/mã hóa để phục vụ xác thực tài khoản.
                            </li>
                            <li>Vai trò tài khoản, trạng thái hoạt động, trạng thái vô hiệu hóa hoặc yêu cầu xóa tài khoản.</li>
                        </BulletList>

                        <h3 className="pt-3 font-medium text-foreground">2.2. Dữ liệu học tập</h3>
                        <BulletList>
                            <li>Danh sách khóa học đã đăng ký hoặc tham gia.</li>
                            <li>Tiến độ học tập, trạng thái hoàn thành bài học và khóa học.</li>
                            <li>Lịch sử làm quiz, bài kiểm tra cuối khóa, câu trả lời, điểm số và kết quả đạt/không đạt.</li>
                            <li>Thông tin chứng chỉ, bao gồm tên học viên, tên khóa học, mã chứng chỉ và ngày cấp.</li>
                            <li>Đánh giá, điểm số và nhận xét khóa học do học viên gửi.</li>
                        </BulletList>

                        <h3 className="pt-3 font-medium text-foreground">2.3. Hồ sơ xác minh giảng viên</h3>
                        <BulletList>
                            <li>Thông tin xác minh chuyên môn và danh tính do giảng viên cung cấp.</li>
                            <li>Ảnh CCCD mặt trước, ảnh CCCD mặt sau.</li>
                            <li>Bằng cấp, chứng chỉ hoặc tài liệu chứng minh chuyên môn.</li>
                        </BulletList>
                        <p>
                            Hồ sơ xác minh giảng viên được lưu lại sau khi được duyệt nhằm phục vụ quản lý
                            quyền giảng viên, xử lý khiếu nại và bảo vệ chất lượng nội dung trên nền tảng.
                        </p>

                        <h3 className="pt-3 font-medium text-foreground">2.4. Dữ liệu kỹ thuật và theo dõi</h3>
                        <p>
                            Tại thời điểm cập nhật chính sách này, LearnHub chưa triển khai việc thu thập
                            lịch sử đăng nhập, thông tin thiết bị, địa chỉ IP cho mục đích phân tích hành vi,
                            dịch vụ phân tích truy cập, đăng nhập Google/Facebook hoặc hệ thống gửi email/
                            thông báo qua bên thứ ba.
                        </p>
                    </PolicySection>

                    <PolicySection title="3. Mục đích sử dụng dữ liệu">
                        <p>LearnHub xử lý dữ liệu của bạn cho các mục đích sau:</p>
                        <BulletList>
                            <li>Tạo, xác thực và quản lý tài khoản người dùng.</li>
                            <li>Phân quyền phù hợp cho học viên, giảng viên và quản trị viên.</li>
                            <li>Cung cấp khóa học, bài giảng, tài liệu, quiz và bài kiểm tra cuối khóa.</li>
                            <li>Ghi nhận tiến độ, kết quả học tập, trạng thái hoàn thành và cấp chứng chỉ.</li>
                            <li>Hiển thị và quản lý đánh giá khóa học.</li>
                            <li>Xác minh tư cách giảng viên trước khi cho phép cung cấp nội dung học tập.</li>
                            <li>Quản trị hệ thống, xử lý nội dung vi phạm, hỗ trợ người dùng và giải quyết khiếu nại.</li>
                            <li>Bảo vệ an toàn, tính toàn vẹn và hoạt động ổn định của nền tảng.</li>
                        </BulletList>
                    </PolicySection>

                    <PolicySection title="4. Cách thức cung cấp và sự đồng ý của người dùng">
                        <p>
                            Bạn cung cấp dữ liệu trực tiếp khi tạo tài khoản, chỉnh sửa hồ sơ, gửi hồ sơ
                            xác minh giảng viên, tham gia khóa học, làm bài kiểm tra, nhận chứng chỉ hoặc
                            gửi đánh giá.
                        </p>
                        <p>
                            Bằng việc đăng ký và sử dụng LearnHub, bạn xác nhận đã đọc Chính sách bảo mật
                            này và đồng ý để LearnHub xử lý dữ liệu cần thiết nhằm cung cấp các chức năng
                            bạn sử dụng, trong phạm vi pháp luật cho phép.
                        </p>
                    </PolicySection>

                    <PolicySection title="5. Dữ liệu của người dùng dưới 16 tuổi">
                        <p>
                            LearnHub hiện cho phép người dùng dưới 16 tuổi đăng ký. Việc cung cấp và xử lý
                            dữ liệu của người dùng dưới 16 tuổi cần có sự đồng ý, hướng dẫn hoặc giám sát
                            phù hợp của cha mẹ/người giám hộ hợp pháp theo quy định pháp luật áp dụng.
                        </p>
                        <p>
                            Cha mẹ hoặc người giám hộ có thể liên hệ LearnHub để yêu cầu hỗ trợ truy cập,
                            chỉnh sửa, vô hiệu hóa hoặc xử lý dữ liệu liên quan đến tài khoản của trẻ em.
                        </p>
                    </PolicySection>

                    <PolicySection title="6. Nơi lưu trữ và nhà cung cấp dịch vụ hỗ trợ">
                        <p>
                            Để vận hành nền tảng, LearnHub sử dụng các dịch vụ hạ tầng sau:
                        </p>
                        <BulletList>
                            <li>
                                <span className="font-medium text-foreground">Vercel:</span> triển khai giao diện website.
                            </li>
                            <li>
                                <span className="font-medium text-foreground">Railway:</span> triển khai backend xử lý nghiệp vụ.
                            </li>
                            <li>
                                <span className="font-medium text-foreground">Supabase Database:</span> lưu trữ dữ liệu có cấu trúc của hệ thống.
                            </li>
                            <li>
                                <span className="font-medium text-foreground">Supabase Storage:</span> lưu trữ file tải lên như ảnh đại diện,
                                tài liệu khóa học và hồ sơ xác minh giảng viên.
                            </li>
                        </BulletList>
                        <p>
                            Các nhà cung cấp này có thể xử lý hoặc lưu trữ dữ liệu trong phạm vi cần thiết
                            để cung cấp hạ tầng kỹ thuật cho LearnHub. LearnHub không bán dữ liệu cá nhân
                            của người dùng cho bên thứ ba.
                        </p>
                    </PolicySection>

                    <PolicySection title="7. Chia sẻ và công khai dữ liệu">
                        <BulletList>
                            <li>
                                Dữ liệu hồ sơ cá nhân và dữ liệu học tập chỉ được truy cập theo vai trò và
                                quyền phù hợp trên hệ thống.
                            </li>
                            <li>
                                Giảng viên có thể xem dữ liệu cần thiết của học viên trong các khóa học do
                                mình quản lý, chẳng hạn tiến độ và kết quả học tập.
                            </li>
                            <li>
                                Quản trị viên có thể truy cập dữ liệu cần thiết để duyệt hồ sơ, quản lý nội
                                dung, hỗ trợ người dùng và xử lý vi phạm.
                            </li>
                            <li>
                                Đánh giá và nhận xét khóa học có thể được hiển thị trên nền tảng để người
                                dùng khác tham khảo.
                            </li>
                            <li>
                                Chức năng chia sẻ chứng chỉ cho người không đăng nhập hiện chưa được triển
                                khai. Nếu được triển khai trong tương lai, LearnHub sẽ thông báo rõ dữ liệu
                                nào được công khai trước khi áp dụng.
                            </li>
                        </BulletList>
                        <p>
                            LearnHub chỉ cung cấp dữ liệu cho cơ quan có thẩm quyền khi có yêu cầu hợp pháp
                            hoặc khi cần thiết để bảo vệ quyền và lợi ích hợp pháp của nền tảng và người dùng.
                        </p>
                    </PolicySection>

                    <PolicySection title="8. Thời gian lưu trữ, vô hiệu hóa và xóa tài khoản">
                        <BulletList>
                            <li>
                                Khi tài khoản đang hoạt động, LearnHub lưu dữ liệu cần thiết để cung cấp các
                                chức năng học tập và quản lý tài khoản.
                            </li>
                            <li>
                                Khi người dùng chọn vô hiệu hóa tài khoản, tài khoản tạm ngừng hoạt động
                                nhưng chưa bị xóa và có thể được mở lại theo chức năng hệ thống hỗ trợ.
                            </li>
                            <li>
                                Khi người dùng yêu cầu xóa tài khoản, LearnHub áp dụng thời gian chờ 30 ngày
                                trước khi tiến hành xóa tài khoản.
                            </li>
                            <li>
                                CCCD và bằng cấp/chứng chỉ của giảng viên hiện được lưu lại sau khi hồ sơ
                                xác minh được duyệt.
                            </li>
                        </BulletList>
                        <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm leading-6">
                            Việc xử lý cụ thể đối với tiến độ học tập, điểm thi, chứng chỉ, đánh giá và hồ sơ
                            xác minh giảng viên sau khi tài khoản bị xóa đang được LearnHub hoàn thiện.
                            Trong thời gian chưa công bố cơ chế chính thức, người dùng có thể liên hệ hỗ trợ
                            để được thông tin về phạm vi xử lý dữ liệu trong từng trường hợp.
                        </div>
                    </PolicySection>

                    <PolicySection title="9. Quyền và lựa chọn của người dùng">
                        <p>
                            Tùy theo chức năng đang được cung cấp và phạm vi pháp luật áp dụng, bạn có thể:
                        </p>
                        <BulletList>
                            <li>Xem và cập nhật thông tin hồ sơ cá nhân của mình.</li>
                            <li>Đổi mật khẩu và quản lý bảo mật tài khoản.</li>
                            <li>Chỉnh sửa hoặc xóa đánh giá khóa học do mình gửi theo chức năng hệ thống hỗ trợ.</li>
                            <li>Vô hiệu hóa tài khoản hoặc gửi yêu cầu xóa tài khoản.</li>
                            <li>
                                Liên hệ LearnHub để yêu cầu hỗ trợ về dữ liệu cá nhân, hồ sơ xác minh,
                                chứng chỉ hoặc khiếu nại liên quan đến quyền riêng tư.
                            </li>
                        </BulletList>
                    </PolicySection>

                    <PolicySection title="10. An toàn dữ liệu">
                        <p>
                            LearnHub áp dụng các biện pháp kỹ thuật và quản trị phù hợp nhằm hạn chế truy
                            cập trái phép, mất mát, lạm dụng hoặc tiết lộ dữ liệu ngoài mục đích cung cấp
                            dịch vụ. Mật khẩu được lưu ở dạng đã băm/mã hóa và quyền truy cập được phân chia
                            theo vai trò người dùng.
                        </p>
                        <p>
                            Không hệ thống trực tuyến nào có thể bảo đảm an toàn tuyệt đối. Người dùng cần
                            sử dụng mật khẩu đủ mạnh, không chia sẻ thông tin đăng nhập và thông báo sớm cho
                            LearnHub nếu nghi ngờ tài khoản bị truy cập trái phép.
                        </p>
                    </PolicySection>

                    <PolicySection title="11. Cookie, đăng nhập bên thứ ba và thông báo">
                        <p>
                            LearnHub hiện chưa tích hợp đăng nhập Google/Facebook, công cụ phân tích truy
                            cập của bên thứ ba, email notification hoặc push notification. Nếu các tính năng
                            này được triển khai trong tương lai và làm phát sinh việc xử lý dữ liệu mới,
                            Chính sách bảo mật sẽ được cập nhật trước hoặc tại thời điểm áp dụng.
                        </p>
                    </PolicySection>

                    <PolicySection title="12. Thay đổi chính sách">
                        <p>
                            LearnHub có thể sửa đổi Chính sách bảo mật khi thay đổi tính năng, hạ tầng kỹ
                            thuật, cách xử lý dữ liệu hoặc yêu cầu pháp luật. Phiên bản mới sẽ được đăng tải
                            trên trang này kèm ngày cập nhật gần nhất.
                        </p>
                    </PolicySection>

                    <PolicySection title="13. Liên hệ và khiếu nại">
                        <p>
                            Mọi câu hỏi, yêu cầu hoặc khiếu nại liên quan đến dữ liệu cá nhân và quyền riêng
                            tư vui lòng liên hệ:
                        </p>
                        <div className="rounded-lg border border-border bg-card p-5">
                            <p className="font-medium text-foreground">LearnHub</p>
                            <p>
                                Email:{" "}
                                <a
                                    href="mailto:24520016@gm.uit.edu.vn"
                                    className="font-medium text-primary underline-offset-4 hover:underline"
                                >
                                    24520016@gm.uit.edu.vn
                                </a>
                            </p>
                            <p>Pháp luật áp dụng: Pháp luật Việt Nam.</p>
                        </div>
                    </PolicySection>
                </div>
            </main>
        </div>
    )
}
