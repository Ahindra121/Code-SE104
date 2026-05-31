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

export default function TermsPage() {
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
                        Điều khoản dịch vụ
                    </h1>
                    <p className="mb-2 text-sm text-muted-foreground">
                        Cập nhật lần cuối: 31/05/2026
                    </p>
                    <p className="text-base leading-7 text-muted-foreground">
                        Chào mừng bạn đến với LearnHub. Bằng việc truy cập, đăng ký tài khoản hoặc sử dụng
                        các chức năng của nền tảng, bạn xác nhận đã đọc, hiểu và đồng ý tuân thủ các điều
                        khoản dưới đây.
                    </p>
                </div>

                <div className="space-y-10 text-base leading-7">
                    <PolicySection title="1. Giới thiệu và phạm vi áp dụng">
                        <p>
                            LearnHub là nền tảng cung cấp khóa học trực tuyến, hỗ trợ người học tiếp cận
                            bài giảng, tài liệu, bài kiểm tra, theo dõi tiến độ, nhận chứng chỉ và đánh giá
                            khóa học; đồng thời hỗ trợ giảng viên xây dựng và quản lý nội dung học tập.
                        </p>
                        <p>
                            Các điều khoản này áp dụng cho khách truy cập, học viên, giảng viên và quản trị
                            viên khi sử dụng website LearnHub.
                        </p>
                    </PolicySection>

                    <PolicySection title="2. Tài khoản và đăng ký sử dụng">
                        <BulletList>
                            <li>
                                Bạn phải cung cấp thông tin chính xác, đầy đủ và cập nhật khi đăng ký hoặc
                                chỉnh sửa hồ sơ cá nhân.
                            </li>
                            <li>
                                Bạn chịu trách nhiệm bảo mật thông tin đăng nhập và không chia sẻ tài khoản
                                cho người khác sử dụng trái phép.
                            </li>
                            <li>
                                Mọi hoạt động phát sinh từ tài khoản của bạn được xem là do bạn thực hiện,
                                trừ khi bạn thông báo kịp thời về việc bị truy cập trái phép.
                            </li>
                            <li>
                                LearnHub có thể yêu cầu xác minh thêm thông tin khi cần bảo vệ tài khoản,
                                xử lý vi phạm hoặc thực hiện chức năng dành cho giảng viên.
                            </li>
                        </BulletList>
                    </PolicySection>

                    <PolicySection title="3. Người dùng dưới 16 tuổi">
                        <p>
                            LearnHub hiện cho phép người dùng dưới 16 tuổi đăng ký sử dụng. Người dùng dưới
                            16 tuổi chỉ nên tạo tài khoản và sử dụng nền tảng dưới sự đồng ý, hướng dẫn hoặc
                            giám sát của cha mẹ/người giám hộ hợp pháp.
                        </p>
                        <p>
                            Cha mẹ hoặc người giám hộ có thể liên hệ LearnHub để yêu cầu hỗ trợ kiểm tra,
                            chỉnh sửa hoặc xử lý tài khoản và dữ liệu của người dùng chưa thành niên theo
                            quy định pháp luật áp dụng.
                        </p>
                    </PolicySection>

                    <PolicySection title="4. Vai trò và quyền sử dụng">
                        <h3 className="font-medium text-foreground">4.1. Học viên</h3>
                        <BulletList>
                            <li>Tìm kiếm, đăng ký và tham gia các khóa học được công khai trên nền tảng.</li>
                            <li>Xem bài giảng, tài liệu, làm quiz và bài kiểm tra cuối khóa theo điều kiện của từng khóa học.</li>
                            <li>Theo dõi tiến độ học tập, nhận và xem chứng chỉ khi đủ điều kiện.</li>
                            <li>Đánh giá, nhận xét khóa học sau khi hoàn thành và chỉnh sửa/xóa đánh giá theo chức năng hệ thống hỗ trợ.</li>
                        </BulletList>

                        <h3 className="pt-3 font-medium text-foreground">4.2. Giảng viên</h3>
                        <BulletList>
                            <li>
                                Gửi hồ sơ xác minh giảng viên, bao gồm giấy tờ định danh và tài liệu chứng
                                minh chuyên môn theo yêu cầu của hệ thống.
                            </li>
                            <li>
                                Sau khi được xác minh, tạo và quản lý khóa học, bài giảng, tài liệu, quiz
                                và bài kiểm tra cuối khóa.
                            </li>
                            <li>
                                Theo dõi học viên, tiến độ, kết quả và các thống kê liên quan đến khóa học
                                do mình quản lý.
                            </li>
                            <li>
                                Chỉ đăng tải nội dung mà mình sở hữu hoặc có quyền hợp pháp để sử dụng và
                                phân phối.
                            </li>
                        </BulletList>

                        <h3 className="pt-3 font-medium text-foreground">4.3. Quản trị viên</h3>
                        <BulletList>
                            <li>Duyệt hoặc từ chối hồ sơ xác minh giảng viên và khóa học.</li>
                            <li>Quản lý tài khoản, nội dung, đánh giá và hoạt động vi phạm trên nền tảng.</li>
                            <li>
                                Ẩn, gỡ bỏ hoặc xử lý khóa học, tài liệu, đánh giá hay tài khoản vi phạm
                                điều khoản hoặc pháp luật.
                            </li>
                        </BulletList>
                    </PolicySection>

                    <PolicySection title="5. Khóa học, học liệu và kết quả học tập">
                        <BulletList>
                            <li>
                                Nội dung khóa học có thể bao gồm video, tài liệu, câu hỏi quiz, bài kiểm
                                tra cuối khóa và các học liệu khác do giảng viên cung cấp.
                            </li>
                            <li>
                                Hệ thống có thể ghi nhận tiến độ xem bài giảng, kết quả quiz, bài kiểm tra,
                                trạng thái hoàn thành và lịch sử học tập để vận hành khóa học.
                            </li>
                            <li>
                                Điều kiện hoàn thành, điểm đạt, số lần làm bài và điều kiện cấp chứng chỉ
                                có thể khác nhau tùy từng khóa học.
                            </li>
                            <li>
                                LearnHub không bảo đảm rằng mọi khóa học sẽ đáp ứng mọi mục tiêu cá nhân,
                                nghề nghiệp hoặc yêu cầu công nhận của tổ chức bên ngoài.
                            </li>
                        </BulletList>
                    </PolicySection>

                    <PolicySection title="6. Chứng chỉ">
                        <p>
                            Học viên đủ điều kiện hoàn thành khóa học có thể được cấp chứng chỉ điện tử
                            hiển thị tên học viên, tên khóa học, mã chứng chỉ, ngày cấp và thông tin giảng
                            viên theo thiết kế của hệ thống.
                        </p>
                        <p>
                            Chứng chỉ LearnHub ghi nhận việc hoàn thành khóa học trên nền tảng và không mặc
                            nhiên thay thế văn bằng, chứng chỉ nghề nghiệp hoặc chứng nhận do cơ quan có
                            thẩm quyền cấp.
                        </p>
                        <p>
                            Chức năng chia sẻ công khai chứng chỉ cho người chưa đăng nhập hiện chưa được
                            triển khai. Khi chức năng này được bổ sung, LearnHub sẽ cập nhật thông tin liên
                            quan trước khi áp dụng.
                        </p>
                    </PolicySection>

                    <PolicySection title="7. Học phí và thanh toán">
                        <p>
                            Tại thời điểm cập nhật điều khoản này, các khóa học trên LearnHub đang được cung
                            cấp miễn phí và chưa tích hợp chức năng thanh toán trực tuyến hoặc hoàn tiền.
                        </p>
                        <p>
                            Hệ thống có thể cho phép giảng viên thiết lập mức học phí cho khóa học, nhưng
                            các khóa học hiện tại đang có giá trị 0 VND. Nếu LearnHub triển khai khóa học
                            trả phí trong tương lai, chính sách thanh toán và hoàn tiền sẽ được công bố
                            riêng trước khi phát sinh giao dịch.
                        </p>
                    </PolicySection>

                    <PolicySection title="8. Quyền sở hữu trí tuệ và nội dung đăng tải">
                        <BulletList>
                            <li>
                                Giao diện, nhãn hiệu, cấu trúc và các nội dung do LearnHub phát triển thuộc
                                quyền của LearnHub hoặc bên cấp phép hợp pháp.
                            </li>
                            <li>
                                Giảng viên giữ quyền đối với nội dung do mình đăng tải, đồng thời cấp cho
                                LearnHub quyền lưu trữ, hiển thị, truyền tải và phân phối nội dung đó trong
                                phạm vi cần thiết để cung cấp dịch vụ học tập.
                            </li>
                            <li>
                                Người dùng không được sao chép, tải lại, bán, phát tán hoặc sử dụng trái
                                phép video, tài liệu, đề kiểm tra hoặc nội dung thuộc quyền của người khác.
                            </li>
                            <li>
                                Người đăng tải chịu trách nhiệm về quyền sử dụng nội dung, tính chính xác
                                và việc không xâm phạm quyền sở hữu trí tuệ hoặc quyền riêng tư của bên thứ ba.
                            </li>
                        </BulletList>
                    </PolicySection>

                    <PolicySection title="9. Hành vi bị cấm">
                        <BulletList>
                            <li>Cung cấp thông tin giả mạo hoặc mạo danh cá nhân, tổ chức khác.</li>
                            <li>
                                Đăng tải nội dung trái pháp luật, xúc phạm, gây hại, xâm phạm bản quyền,
                                quyền riêng tư hoặc dữ liệu cá nhân của người khác.
                            </li>
                            <li>
                                Gian lận trong quá trình học, làm quiz, bài kiểm tra hoặc tìm cách can thiệp
                                trái phép vào điểm số, tiến độ và chứng chỉ.
                            </li>
                            <li>
                                Truy cập trái phép, khai thác lỗ hổng, phát tán mã độc, làm gián đoạn hoặc
                                gây ảnh hưởng đến hoạt động của hệ thống.
                            </li>
                            <li>
                                Thu thập, sao chép hoặc sử dụng dữ liệu người dùng khác khi chưa được phép.
                            </li>
                        </BulletList>
                    </PolicySection>

                    <PolicySection title="10. Vô hiệu hóa và xóa tài khoản">
                        <BulletList>
                            <li>
                                Người dùng có thể vô hiệu hóa tài khoản; thao tác này tạm ngừng khả năng sử
                                dụng tài khoản và tài khoản có thể được mở lại theo chức năng hệ thống hỗ trợ.
                            </li>
                            <li>
                                Khi người dùng yêu cầu xóa tài khoản, LearnHub áp dụng thời gian chờ 30 ngày
                                trước khi tiến hành xóa tài khoản.
                            </li>
                            <li>
                                Trong thời gian chờ, người dùng có thể liên hệ bộ phận hỗ trợ để được hướng
                                dẫn về việc hủy yêu cầu hoặc xử lý tài khoản.
                            </li>
                            <li>
                                Cách xử lý cụ thể đối với tiến độ học tập, kết quả kiểm tra, chứng chỉ,
                                đánh giá và hồ sơ xác minh giảng viên sau khi xóa tài khoản sẽ được thực hiện
                                theo Chính sách bảo mật và cơ chế hệ thống được cập nhật tại thời điểm áp dụng.
                            </li>
                        </BulletList>
                    </PolicySection>

                    <PolicySection title="11. Xử lý vi phạm và tạm ngừng dịch vụ">
                        <p>
                            LearnHub có quyền cảnh báo, hạn chế quyền truy cập, vô hiệu hóa tài khoản, ẩn
                            hoặc xóa nội dung khi phát hiện hành vi vi phạm điều khoản này, vi phạm pháp luật
                            hoặc gây nguy cơ ảnh hưởng đến người dùng và hệ thống.
                        </p>
                        <p>
                            LearnHub có thể bảo trì, thay đổi hoặc tạm ngừng một phần dịch vụ nhằm nâng cấp
                            hệ thống, xử lý sự cố hoặc đáp ứng yêu cầu an toàn và pháp lý.
                        </p>
                    </PolicySection>

                    <PolicySection title="12. Giới hạn trách nhiệm">
                        <p>
                            LearnHub nỗ lực duy trì nền tảng ổn định và an toàn, tuy nhiên không cam kết
                            dịch vụ luôn hoạt động liên tục, không có lỗi hoặc mọi nội dung do giảng viên
                            đăng tải đều phù hợp với nhu cầu riêng của từng người học.
                        </p>
                        <p>
                            Trong phạm vi pháp luật cho phép, LearnHub không chịu trách nhiệm đối với tổn
                            thất phát sinh từ việc người dùng vi phạm điều khoản, sử dụng sai mục đích, chia
                            sẻ tài khoản hoặc dựa hoàn toàn vào nội dung khóa học để đưa ra quyết định quan trọng.
                        </p>
                    </PolicySection>

                    <PolicySection title="13. Thay đổi điều khoản">
                        <p>
                            LearnHub có thể cập nhật Điều khoản dịch vụ để phản ánh thay đổi của chức năng,
                            phương thức vận hành hoặc yêu cầu pháp luật. Phiên bản cập nhật sẽ được công bố
                            trên trang này cùng ngày cập nhật gần nhất.
                        </p>
                        <p>
                            Việc bạn tiếp tục sử dụng nền tảng sau khi điều khoản được cập nhật đồng nghĩa
                            với việc bạn chấp nhận phiên bản mới, trong phạm vi pháp luật cho phép.
                        </p>
                    </PolicySection>

                    <PolicySection title="14. Luật áp dụng và liên hệ">
                        <p>
                            Điều khoản này được điều chỉnh và giải thích theo pháp luật Việt Nam. Mọi khiếu
                            nại hoặc yêu cầu hỗ trợ liên quan đến việc sử dụng LearnHub trước hết sẽ được ưu
                            tiên giải quyết thông qua trao đổi thiện chí.
                        </p>
                        <p>
                            Email liên hệ hỗ trợ và khiếu nại:{" "}
                            <a
                                href="mailto:24520016@gm.uit.edu.vn"
                                className="font-medium text-primary underline-offset-4 hover:underline"
                            >
                                24520016@gm.uit.edu.vn
                            </a>
                        </p>
                    </PolicySection>
                </div>
            </main>
        </div>
    )
}
