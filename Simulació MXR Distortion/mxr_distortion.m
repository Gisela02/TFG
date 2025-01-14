function [vout,vo1,xc2,xc3,xc4,xc5,xc6] = mxr_distortion(vi,Ts,wipper_out,wipper_dis,xc2,xc3,xc4,xc5,xc6)

% Constants de l'etapa de sortida
% -----------------------

rv=10e3; r5=rv; c4=1e-6;c5=1e-9; % Valors de Components
Rc4=Ts/(2*c4); Rc5=Ts/(2*c5); Rc5v = Rc5*rv/(Rc5+rv); % Model condensadors 
K=Rc5v/(Rc5v+Rc4+r5); % Constants del circuit

% Constants de l'etapa d'entrada (Filtre passa-alt)
% ---------------------------------------

c1 = 1e-9; c2=10e-9;c3=47e-9; c6=1e-6; % Valors dels condensadors
r1 = 10e3; r2=1e6; r3=4700; r4=r2; r67=500e3;rv_dis=wipper_dis*1e6; % Valor resistències
rc2=Ts/(2*c2); rc3=Ts/(2*c3); rc6=Ts/(2*c6); % Model condensadors
req3=rv_dis+r3; req2=r67*rc6/(r67+rc6);
k_n_inv=1+r4/(rc3+req3); k_inv=r4/(rc3+req3);
k1=1/(rc2+r1+r2+req2); k2=1/(rc3+req3+r4);

% Detecció de l'entrada si és mono o estèreo

if length(vi(:,1)) == 1
    vout = zeros(length(vi));
    vo1=vout;
    % Iteració sobre les mostres
    for n=1:length(vout)
        % sortida primera etapa
        vo1(n)=k_n_inv*k1*((r2+req2)*(vi(n)-rc2*xc2)+(rc2+r1)*req2*xc6)+k_inv*rc3*xc3;
        xc2=k1*(2*(vi(n)-req2*xc6)+(r1+r2+req2-rc2)*xc2);
        xc6=(2*k1/rc6)*req2*(vi(n)+(r1+r2+rc2)*xc6-rc2*xc2)-xc6;
        xc3=k2*((req3+r4-rc3)*xc3-2*vo1(n));
        
        % sortida segona etapa
        vc5=output_stage(vo1(n),K,Rc4,r5,xc4,xc5);
        vout(n)=wipper_out*vc5;
        xc5=2*vc5/Rc5-xc5;
        xc4=(2*(vi(n)-vc5)+xc4*(r5-Rc4))/(Rc4+r5);
    end
else
    vout = zeros(size(vi));
    vo1=vout;

    for n=1:length(vout(1,:))
        %---- primera etapa 
        vo1(:,n)=k_n_inv*k1*((r2+req2)*(vi(:,n)-rc2*xc2)+(rc2+r1)*req2*xc6)+k_inv*rc3*xc3;
        xc2=k1*(2*(vi(:,n)-req2*xc6)+(r1+r2+req2-rc2)*xc2);
        xc6=(2*k1/rc6)*req2*(vi(:,n)+(r1+r2+rc2)*xc6-rc2*xc2)-xc6;
        xc3=k2*((req3+r4-rc3)*xc3-2*vo1(:,n));
        %---- segona etapa (sortida)
        vc5(1,1)=output_stage(vo1(1,n),K,Rc4,r5,xc4(1,1),xc5(1,1));
        vc5(2,1)=output_stage(vo1(2,n),K,Rc4,r5,xc4(2,1),xc5(2,1));
        vout(:,n)=wipper_out*vc5;
        xc5=2*vc5/Rc5-xc5;
        xc4=(2*(vi(:,n)-vc5)+xc4*(r5-Rc4))/(Rc4+r5);
    end
    
end
    