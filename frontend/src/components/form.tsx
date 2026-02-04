import type { FC, ReactNode, FormHTMLAttributes } from 'react';
import { BackToHomeButton } from './back_to_home';

interface FormProps extends FormHTMLAttributes<HTMLFormElement> {
    children: ReactNode;
}

export const Form: FC<FormProps> = ({ children, ...props }) => {
    return (
        <div>
            <div className="card-background">
                <form {...props}>
                    {children}  
                </form>
            </div>
            <div className="mt-4 flex justify-center">
                <BackToHomeButton/>
            </div>
        </div>
    );
};