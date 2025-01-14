function vc5 = output_stage(vi,K,Rc4,R5,xc4,xc5) 

error=100;
iter=0;
tolerance=1e-5;
n_iter=100;
n = 1.8;
T = 25;
k = 1.3806488e-23;
q = 1.6022e-19;
Vt = 22e-3;
Is = 1e-9;
vc50 = 0.7;
while abs(error)>tolerance && iter < n_iter
    f = vc50-K*(vi-Rc4*xc4+(Rc4+R5)*(xc5-2*Is*sinh(vc50/(n*Vt))));
    df = 1+K*(Rc4+R5)*2*Is*cosh(vc50/(n*Vt))/(n*Vt); 
    vc5 = vc50 - f/df;
    error = vc50-vc5;
    vc50 = vc5;

end