import seaborn as sns
from sklearn.linear_model import LinearRegression
from sklearn.metrics import r2_score
import statsmodels.api as sm
import scipy.stats as stats
# print(total_data.head())

sns.set(font_scale = 1.3)
f, ax = plt.subplots(figsize=(12, 12), dpi=300)
# plt.xlim(-0.05, 1.05)
# plt.ylim(1.8, 7.2)
f.set_facecolor('white') # set background color
ax.set_title('{}: Correlation between Subject rank order and pyfeat score order'.format(myexp)) # title
ax.set_xlabel('PyFeat {} score order'.format(myexp)) # x-axis
ax.set_ylabel('Subject {} ranking order'.format(myexp)) # y-axis

values = []
for i in range(len(cleaned_result)):
    temp_data = list(enumerate(cleaned_result[i][1]))
    # print(j_data)
    # compute rank 
    temp_list = []
    for j, c in enumerate(temp_data):
        temp_list.append((c, exp_name_rank_order_pyfeat[c[1]]))
    temp_list.sort(key=lambda x:x[1])
    # temp_list = [x[0] for x in temp_list]
    
    average_rank, _ = get_average_rank(subject_data, feat_data)
    
    x = [k[1] for k in temp_list]
    y = [m[0][0] for m in temp_list]
    
   
    X, y = np.array(x), np.array(y)
    # print(X, y)
    X = X[:, None] # Reshape to 2D as requested
    reg = LinearRegression()
    reg.fit(X, y)
    
    # Predict response
    predictions = reg.predict(X)
    
    # pearsonr
    #     my_corrcoef = stats.pearsonr(fig_data[0], y)
    #     print('my_corrcoef', my_corrcoef)

    #     my_rho = np.corrcoef(fig_data[0], y)
    #     print('my_rho', my_rho)
    
    # Use stats linregress library
    reg2 = stats.linregress(x, y)
    print(reg2)
    # subject_name
    s_name = 'subject' + str(i + 1)
    # r is The Pearson correlation coefficient
    sns.regplot(x=x, y=y, ci=None, label=s_name)
    # sns.regplot(x, y, ci=None, label=s_name + ' r = {:.4}, p-value = {:.4}'.format(reg2.rvalue, reg2.pvalue))
    
    # break
plt.legend(loc='upper left')
plt.savefig('{}_linear_regression_fitting_simple_ver.png'.format(myexp), bbox_inches='tight', dpi=300)