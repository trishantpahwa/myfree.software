import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function Login() {

    const router = useRouter();
    const { code } = router.query;

    useEffect(() => {
        const _login = async () => {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ code }),
            });
            if (response.ok) {
                const data = await response.json();
                localStorage.setItem("token", data.token);
                localStorage.setItem("user", JSON.stringify(data.user));
                router.push("/");
            } else {
                console.error("Login failed");
            }
        };
        if (code) _login();
    }, [code])

    const login = () => {
        router.push(`https://github.com/login/oauth/authorize?client_id=${process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID}&scope=repo,user:email`);
    };

    return (
        <>
            <div className="h-screen flex items-center justify-center">
                <DotLottieReact
                    src="/github.lottie"
                    loop
                    autoplay
                    className="w-1/6 h-1/6 cursor-pointer"
                    onClick={login}
                />
            </div>
        </>
    );
};